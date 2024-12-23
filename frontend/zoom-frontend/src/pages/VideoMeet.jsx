import { useEffect, useRef, useState } from "react";
import { TextField, Button } from "@mui/material";
import io from "socket.io-client";

const server_url = "http://localhost:8000";
var connections = {};
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
          if (localVideoRef.current) {
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
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setAudio(false);
          setVideo(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          // todo blackSilence
          let blackSilence = (...agrs) =>
            new MediaStream([black(...agrs), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id]
              .createOffer()
              .then((description) => {
                connections[id]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id,
                      JSON.stringify({ spd: connections[id].description })
                    );
                  })
                  .catch((e) => console.log(e));
              })
              .catch((e) => console.log(e));
          }
        })
    );
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

  let gotMessageFromServer = (formId, message) => {
    var signal = JSON.parce(message);

    if (formId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[formId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[formId]
                .createAnswer()
                .then((description) => {
                  connections[formId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        formId,
                        JSON.stringify({
                          sdp: connections[formId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[formId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };
  let addMessage = () => {};

  let connectToSocket = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      console.log("Connected with socket ID:", socketIdRef.current); //log added to see connection

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
      socketRef.current.on("user-joinde", (id, client) => {
        console.log("userJoined", id, client);

        client.forEach((socketListId) => {
          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(
              peerConfigConnections
            );
            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate != null) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ ice: event.candidate })
                );
              }
            };
          }
          // ADDING STREAM
          connections[socketListId].onaddstream = (event) => {
            console.log("stream added for socket id:", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVide = videos.map((video) => {
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video;
                });
                videoRef.current = updatedVide;
                return updatedVide;
              });
            } else {
              let newVid = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVide = [...videos, newVid];
                videoRef.current = updatedVide;
                return updatedVide;
              });
            }
          };
          // AADING THE LOCAL VIDEO STREAM
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            //TODO BLACK-SILENCE
            // let black-silence
            let blackSilence = (...agrs) =>
              new MediaStream([black(...agrs), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
          if (id === socketIdRef.current) {
            for (let id2 in connections) {
              if (id2 === socketIdRef) continue;

              try {
                connections[id2].addStream(window.localStream);
              } catch (e) {
                console.log(e);
              }
              connections[id2].createOffer().then((description) => {
                connections[id2]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id2,
                      JSON.stringify({ sdp: connections[id2].localStream })
                    );
                  })
                  .catch((e) => console.log(e));
              });
            }
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
            </div>
          ))}
        </>
      )}
    </div>
  );
}
