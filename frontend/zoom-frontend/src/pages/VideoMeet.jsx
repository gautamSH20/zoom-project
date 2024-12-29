import { useEffect, useRef, useState } from "react";
import { TextField, Button } from "@mui/material";
import io from "socket.io-client";

const server_url = "http://localhost:8000";
const connections = {};
const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export default function VideoMeet() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  let [videoAvailabel, setVideoAvailabel] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState([]);
  let [audio, setAudio] = useState();
  let [screen, setscreen] = useState();
  let [showModel, setModel] = useState();
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMesssage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  const videoRef = useRef([]);
  const [videos, setVideos] = useState([]);
  let mediaLineOrder = null;

  const getPermission = async () => {
    try {
      //video permission
      const videoPermisson = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermisson) {
        setVideoAvailabel(true);
      } else {
        setVideoAvailabel(false);
      }
      //AUDIO PERMISSION
      const audioPermisson = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermisson) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }
      // TO ALLOW THE SCREEN SHAREING
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (audioAvailable || videoAvailabel) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailabel,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (userMediaStream && localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    getPermission();
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        // Check if a stream exists before stopping tracks
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.error("Error stopping previous tracks:", e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    // *** KEY CHANGE: Update mediaLineOrder every time the stream changes ***
    mediaLineOrder = stream.getTracks().map((track) => track.kind);
    console.log("New mediaLineOrder:", mediaLineOrder); // Debugging

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      // Remove old tracks before adding new ones
      const senders = connections[id].getSenders();
      stream.getTracks().forEach((newTrack) => {
        const existingSender = senders.find(
          (sender) => sender.track && sender.track.kind === newTrack.kind
        );
        if (existingSender) {
          connections[id].removeTrack(existingSender);
        }
        connections[id].addTrack(newTrack, stream);
      });

      // Always create a new offer after track replacement
      connections[id]
        .createOffer({ ordered: true, iceRestart: true }) // iceRestart is important here
        .then((description) => {
          connections[id]
            .setLocalDescription(description)
            .then(() => {
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({ sdp: connections[id].localDescription })
              );
            })
            .catch((e) => console.error("Error setting local description:", e));
        })
        .catch((e) => console.error("Error creating offer:", e));
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log("Track ended:", track.kind);
        // Re-acquire user media when a track ends
        getUserMedia();
      };
    });
  };

  // READ ABOUT THE SILENCE AND BLACK FUNCTIONS AND INSIDE VARIABLES

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();

    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailabel) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => {
          console.log(e);
        });
    } else {
      try {
        track = localVideoRef.current.srcObject.getTracks();
        track.forEach((track) => track.stop());
      } catch (e) {
        console.log(e);
      }
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log(audio, video);
    }
  }, [audio, video]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        console.log("------>", signal.sdp);
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      } else {
        console.log("sdp-------->foul");
      }

      if (signal.ice) {
        console.log("signal ice------>", signal.ice);
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      } else {
        console.log("ice---->foul");
      }
    }
  };

  // Helper function to process ICE queue
  const processIceQueue = (formId) => {
    const connection = connections[formId];

    if (!connection) {
      console.error(`Connection not found for formId: ${formId}`);
      return false; // Indicate failure
    }

    if (!connection.iceQueue || connection.iceQueue.length === 0) {
      console.log(`No ICE candidates to process for formId: ${formId}`);
      return true; // Nothing to process, but not a failure
    }

    while (connection.iceQueue.length > 0) {
      const iceCandidate = connection.iceQueue.shift();
      connection
        .addIceCandidate(new RTCIceCandidate(iceCandidate))
        .then(() => console.log(`Added ICE candidate for formId: ${formId}`))
        .catch((e) =>
          console.error(
            `Error adding queued ICE candidate for formId: ${formId}:`,
            e
          )
        );
    }

    console.log(`Processed ICE queue for formId: ${formId}`);
    return true; // Indicate success
  };

  let addMessage = () => {};

  let connectToSocket = () => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("Already connected to socket");
      return; // Prevents reconnection if already connected
    }

    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      console.log("Connected with socket ID:", socketIdRef.current);

      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, client) => {
        if (!Array.isArray(client)) client = [client];

        client.forEach((socketListId) => {
          // Ensure socketId doesn't already exist in videos array
          if (!videos.some((video) => video.socketId === socketListId)) {
            connections[socketListId] = new RTCPeerConnection(
              peerConfigConnections
            );

            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ ice: event.candidate })
                );
              }
            };

            connections[socketListId].ontrack = (event) => {
              const stream = event.streams[0];
              if (stream && stream.active) {
                setVideos((prevVideos) => [
                  ...prevVideos,
                  {
                    socketId: socketListId,
                    stream,
                    autoPlay: true,
                    playsinline: true,
                  },
                ]);
              }
            };

            connections[socketListId]
              .createOffer({ ordered: true, iceRestart: true })
              .then((description) => {
                connections[socketListId]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      socketListId,
                      JSON.stringify({
                        sdp: connections[socketListId].localDescription,
                      })
                    );
                  })
                  .catch((e) => console.error(e));
              })
              .catch((e) => console.error(e));
          }
        });
      });
    });
  };

  let getMedia = () => {
    setAudio(audioAvailable);
    setVideo(videoAvailabel);

    connectToSocket();
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };
  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2> Enter the loby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>
          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <>
          <video ref={localVideoRef} autoPlay muted></video>
          {videos.map((video) => (
            <div key={video.socketId}>
              <h2>{video.socketId}</h2>
              <video
                key={video.socketId}
                ref={(ref) => {
                  if (ref) ref.srcObject = video.stream;
                }}
                autoPlay={video.autoPlay}
                playsInline={video.playsinline}
                muted
              ></video>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
