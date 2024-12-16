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
  let [video, setVideo] = useState();
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

  let getUserSuccess = (straem) => {};

  let getUserMedia = () => {
    if ((video && videoAvailabel) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserSuccess)
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

  let gotMessageFromServer = () => {};

  let connectToSocket = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketIdRef.current.on("signal", gotMessageFromServer);
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
        <></>
      )}
    </div>
  );
}
