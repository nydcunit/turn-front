// App.js
import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import { Device } from 'mediasoup-client';
import './App.css';

// Component for remote participants
function RemoteParticipant({ userId, stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="participant">
      <div className="video-wrapper">
        <video ref={videoRef} autoPlay playsInline />
        <div className="participant-info">
          <span className="name">{userId}</span>
          <span className="status broadcasting">🔴 LIVE</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [roomId, setRoomId] = useState('test-room');
  const [userId, setUserId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [participants, setParticipants] = useState(new Map());

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const producerTransportRef = useRef(null);
  const consumerTransportRef = useRef(null);
  const producersRef = useRef(new Map());
  const consumersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const pendingProducersRef = useRef([]);
  const creatingConsumerTransportRef = useRef(false);

  const log = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${message}`]);
    console.log(`[${time}] ${message}`);
  };

  const connect = async () => {
    try {
      log('Connecting to API...');

      const response = await fetch('http://localhost:3000/api/video/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConnectionInfo(data);
      setIsConnected(true);
      log('API Response received');
      log(`Broadcaster URL: ${data.broadcaster.url}`);
    } catch (error) {
      log(`Error: ${error.message}`);
    }
  };

  const disconnect = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsBroadcasting(false);
    setConnectionInfo(null);
    setParticipants(new Map());
    log('Disconnected');
  };

  const startBroadcast = async () => {
    try {
      log('Starting broadcast...');

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
      log('Got local media stream');

      // Connect to socket
      const url = new URL(connectionInfo.broadcaster.url);
      const socketUrl = `${url.protocol}//${url.host}`;
      
      log(`Connecting to socket: ${socketUrl}`);

      socketRef.current = io(socketUrl, {
        path: '/socket.io/',
        query: { token: connectionInfo.broadcaster.token },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        log('✅ Socket connected! ID: ' + socketRef.current.id);
      });

      socketRef.current.on('connect_error', (error) => {
        log(`❌ Socket connection error: ${error.message}`);
      });

      socketRef.current.on('routerCapabilities', async (rtpCapabilities) => {
        log('Received router capabilities');

        // Create device
        deviceRef.current = new Device();
        await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
        log('Device loaded');

        // Create producer transport
        await createProducerTransport();
        
        // Now process any pending producers
        if (pendingProducersRef.current.length > 0) {
          log(`Processing ${pendingProducersRef.current.length} pending producers`);
          for (const producer of pendingProducersRef.current) {
            await handleNewProducer(producer);
          }
          pendingProducersRef.current = [];
        }
      });

      const handleNewProducer = async ({ producerId, userId: remoteUserId, kind }) => {
        log(`🎥 NEW PRODUCER DETECTED: ${remoteUserId} (${kind})`);
        
        if (remoteUserId === userId) {
          log('Skipping own stream');
          return;
        }

        // Create consumer transport only once, even if multiple producers arrive simultaneously
        if (!consumerTransportRef.current && !creatingConsumerTransportRef.current) {
          creatingConsumerTransportRef.current = true;
          await createConsumerTransport();
          creatingConsumerTransportRef.current = false;
        }

        // Wait for consumer transport if it's being created
        while (creatingConsumerTransportRef.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        await consumeStream(producerId, remoteUserId);
      };

      socketRef.current.on('newProducer', async (data) => {
        if (!deviceRef.current) {
          log('Device not ready, queuing producer');
          pendingProducersRef.current.push(data);
          return;
        }
        
        await handleNewProducer(data);
      });

      socketRef.current.on('peerDisconnected', ({ userId: disconnectedUserId }) => {
        log(`User ${disconnectedUserId} disconnected`);
        setParticipants(prev => {
          const updated = new Map(prev);
          updated.delete(disconnectedUserId);
          return updated;
        });
      });

      socketRef.current.onAny((eventName, ...args) => {
        log(`📨 Socket event: ${eventName}`);
      });

      setIsBroadcasting(true);
    } catch (error) {
      log(`Broadcast error: ${error.message}`);
    }
  };

  const createProducerTransport = async () => {
    return new Promise((resolve, reject) => {
      socketRef.current.emit('createTransport', { producing: true, consuming: false }, async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        log('Producer transport created');

        producerTransportRef.current = deviceRef.current.createSendTransport({
          id: response.id,
          iceParameters: response.iceParameters,
          iceCandidates: response.iceCandidates,
          dtlsParameters: response.dtlsParameters,
          iceServers: [connectionInfo.broadcaster.ice]
        });

        producerTransportRef.current.on('connect', ({ dtlsParameters }, callback, errback) => {
          socketRef.current.emit('connectTransport', {
            transportId: producerTransportRef.current.id,
            dtlsParameters
          }, (response) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback();
            }
          });
        });

        producerTransportRef.current.on('produce', ({ kind, rtpParameters }, callback, errback) => {
          socketRef.current.emit('produce', {
            transportId: producerTransportRef.current.id,
            kind,
            rtpParameters
          }, (response) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback({ id: response.id });
            }
          });
        });

        // Start producing
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const audioTrack = localStreamRef.current.getAudioTracks()[0];

        if (videoTrack) {
          const producer = await producerTransportRef.current.produce({ track: videoTrack });
          producersRef.current.set('video', producer);
          log('Video producer created');
        }

        if (audioTrack) {
          const producer = await producerTransportRef.current.produce({ track: audioTrack });
          producersRef.current.set('audio', producer);
          log('Audio producer created');
        }

        // After we start producing, check for other producers in the room
        log('Checking for other producers in the room...');
        socketRef.current.emit('refresh-producers');

        resolve();
      });
    });
  };

  const createConsumerTransport = async () => {
    return new Promise((resolve, reject) => {
      socketRef.current.emit('createTransport', { producing: false, consuming: true }, async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        log('Consumer transport created');

        consumerTransportRef.current = deviceRef.current.createRecvTransport({
          id: response.id,
          iceParameters: response.iceParameters,
          iceCandidates: response.iceCandidates,
          dtlsParameters: response.dtlsParameters,
          iceServers: [connectionInfo.broadcaster.ice]
        });

        consumerTransportRef.current.on('connect', ({ dtlsParameters }, callback, errback) => {
          socketRef.current.emit('connectTransport', {
            transportId: consumerTransportRef.current.id,
            dtlsParameters
          }, (response) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback();
            }
          });
        });

        resolve();
      });
    });
  };

  const consumeStream = async (producerId, remoteUserId) => {
    log(`Attempting to consume stream: ${producerId} from ${remoteUserId}`);

    socketRef.current.emit('consume', {
      producerId,
      rtpCapabilities: deviceRef.current.rtpCapabilities
    }, async (response) => {
      if (response.error) {
        log(`❌ Error consuming: ${response.error}`);
        return;
      }

      log(`✅ Consumer created: ${response.id} for producer ${response.producerId}`);

      const consumer = await consumerTransportRef.current.consume({
        id: response.id,
        producerId: response.producerId,
        kind: response.kind,
        rtpParameters: response.rtpParameters
      });

      consumersRef.current.set(consumer.id, consumer);

      // Update participant info
      setParticipants(prev => {
        const updated = new Map(prev);
        const participant = updated.get(remoteUserId) || { 
          userId: remoteUserId, 
          stream: new MediaStream(),
          videoProducerId: null,
          audioProducerId: null
        };
        
        participant.stream.addTrack(consumer.track);
        
        if (response.kind === 'video') {
          participant.videoProducerId = response.producerId;
        } else if (response.kind === 'audio') {
          participant.audioProducerId = response.producerId;
        }
        
        updated.set(remoteUserId, participant);
        return updated;
      });

      log(`✅ Successfully consuming ${response.kind} from ${remoteUserId}`);
    });
  };

  const stopBroadcast = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    if (producerTransportRef.current) {
      producerTransportRef.current.close();
    }

    if (consumerTransportRef.current) {
      consumerTransportRef.current.close();
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    producersRef.current.clear();
    consumersRef.current.clear();
    setParticipants(new Map());

    setIsBroadcasting(false);
    log('Broadcast stopped');
  };

  return (
    <div className="App">
      <h1>Video Streaming Test (React)</h1>
      
      <div className="section">
        <h2>1. Connect to Stream</h2>
        <div className="controls">
          <input 
            type="text" 
            placeholder="Room ID" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isConnected}
          />
          <input 
            type="text" 
            placeholder="User ID" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isConnected}
          />
          {!isConnected ? (
            <button onClick={connect}>Connect</button>
          ) : (
            <button onClick={disconnect}>Disconnect</button>
          )}
        </div>
        
        {connectionInfo && (
          <div className="response">
            <pre>{JSON.stringify(connectionInfo, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="section">
        <h2>2. Broadcast</h2>
        <div className="controls">
          <button 
            onClick={startBroadcast} 
            disabled={!isConnected || isBroadcasting}
          >
            Start Broadcasting
          </button>
          <button 
            onClick={stopBroadcast} 
            disabled={!isBroadcasting}
          >
            Stop Broadcasting
          </button>
        </div>
      </div>

      <div className="section">
        <h2>3. Participants</h2>
        <div className="participants-grid">
          {/* Local participant */}
          <div className="participant">
            <div className="video-wrapper">
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="participant-info">
                <span className="name">{userId} (You)</span>
                <span className={`status ${isBroadcasting ? 'broadcasting' : ''}`}>
                  {isBroadcasting ? '🔴 LIVE' : 'Not broadcasting'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Remote participants */}
          {Array.from(participants.entries()).map(([participantId, participant]) => (
            <RemoteParticipant
              key={participantId}
              userId={participantId}
              stream={participant.stream}
            />
          ))}
        </div>
      </div>

      <div className="section">
        <h2>4. Logs</h2>
        <div className="log">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;