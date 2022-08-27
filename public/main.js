const divSelectRoom = document.getElementById("selectRoom");
const divConsultingRoom = document.getElementById("consultingRoom");

const inputRoomNumber = document.getElementById("roomId");
const btnGoRoom = document.getElementById("goBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let roomNumber, localStream, remoteStream, rtcPeerConnection;
let isCaller = false;

const iceServers = [
  {
    urls: [
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
      "stun:stun.services.mozilla.com",
    ],
  },
];

const iceServers2 = {
  iceServers: [
    {
      urls: "stun:stun.services.mozilla.com",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
    {
      urls: "stun:stun2.l.google.com:19302",
    },
    {
      urls: "stun:stun3.l.google.com:19302",
    },
    {
      urls: "stun:stun4.l.google.com:19302",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const streamContraints = {
  audio: !true,
  video: { width: 1280, height: 720 },
};

///socket
const socket = io();

function onAddStream(event) {
  console.log("onAddStream function for ontrack event", event);

  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log("Sending ice candidate event", event);
    console.log("Sending ice candidate", event.candidate);

    const label = event.candidate.sdpMLineIndex;
    const id = event.candidate.sdpMid;
    const candidate = event.candidate.candidate;
    console.log(candidate, "actual candidate details");

    const candidateData = {
      type: "candidate",
      label,
      id,
      candidate,
      room: roomNumber,
    };

    socket.emit("candidate", candidateData);
  }
}

btnGoRoom.addEventListener("click", function () {
  if (inputRoomNumber.value === "") {
    alert("Please input a room number");
  } else {
    roomNumber = inputRoomNumber.value;
    socket.emit("create-or-join", roomNumber);
    divSelectRoom.style.display = "none";
    divConsultingRoom.style.display = "flex";
  }
});

socket.on("created", (roomId) => {
  navigator.mediaDevices
    .getUserMedia(streamContraints)
    .then((stream) => {
      // "first mediaDevices stream"
      // console.log(stream,"first mediaDevices stream");
      localStream = stream;
      localVideo.srcObject = stream;
      isCaller = true;
    })
    .catch((err) => {
      console.error(err, "get mediaDevices stream error");
    });
});

socket.on("joined", (roomId) => {
  navigator.mediaDevices
    .getUserMedia(streamContraints)
    .then((stream) => {
      // "first mediaDevices stream"
      console.log(stream, "second / joined t mediaDevices stream");
      localStream = stream;
      localVideo.srcObject = stream;
      isCaller = !true;
      socket.emit("ready", roomId);
    })
    .catch((err) => {
      console.error(err, "get mediaDevices stream error");
    });
});

socket.on("ready", () => {
  if (isCaller === true) {
    //  here we create an instance of RTCPeerConnection which takes in an argument,the argument being an THE ICESERVERS we want to use;
    rtcPeerConnection = new RTCPeerConnection(iceServers);

    // we assign a function that handles what should happen natively if there's an icecandidate event
    rtcPeerConnection.onicecandidate = onIceCandidate;
    // we assign a function that handles what should happen natively if there's a track event
    rtcPeerConnection.ontrack = onAddStream;

    // we add the first track to the rtcpeerConnection :-> audio
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);

    // we add the second track to the rtcpeerConnection :-> video
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);

    //we create an offer event which return us the sessiondescription

    rtcPeerConnection
      .createOffer()
      .then((sessionDescription) => {
        console.log(sessionDescription , "offer sdp");
        //then we set the local desciption and pass the offer sessionDescription
        rtcPeerConnection.setLocalDescription(sessionDescription);

        const offerData = {
          type: "offer",
          sdp: sessionDescription,
          room: roomNumber,
        };

        socket.emit("offer", offerData);
      })
      .catch((err) => {
        console.log(err, "offer creation error");
      });
  }
});

socket.on("offer", (event) => {
  if (!isCaller) {
    //  here we create an instance of RTCPeerConnection which takes in an argument,the argument being an THE ICESERVERS we want to use;
    rtcPeerConnection = new RTCPeerConnection(iceServers2);

    // we assign a function that handles what should happen natively if there's an icecandidate event
    rtcPeerConnection.onicecandidate = onIceCandidate;
    // we assign a function that handles what should happen natively if there's a track event
    rtcPeerConnection.ontrack = onAddStream;

    // we add the first track to the rtcpeerConnection :-> audio
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);

    // we add the second track to the rtcpeerConnection :-> video
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);

    //we receive the remote Description
    const remoteDescription = new RTCSessionDescription(event);

    rtcPeerConnection.setRemoteDescription(remoteDescription);

    //we create an answer event which return us the sessiondescription

    rtcPeerConnection
      .createAnswer()
      .then((sessionDescription) => {
        //then we set the local desciption and pass the answer sessionDescription
        rtcPeerConnection.setLocalDescription(sessionDescription);

        const answerData = {
          type: "answer",
          sdp: sessionDescription,
          room: roomNumber,
        };

        socket.emit("answer", answerData);
      })
      .catch((err) => {
        console.log(err, "offer creation error");
      });
  }
});

socket.on("answer", (event) => {
  const remoteDescription = new RTCSessionDescription(event);
  rtcPeerConnection.setRemoteDescription(remoteDescription);
});
socket.on("candidate", (event) => {
  const iceCandidateData = {
    sdpMLineIndex: event.label,
    // sdpMid:event.id,
    candidate: event.candidate,
  };
  const candidate = new RTCIceCandidate(iceCandidateData);

  rtcPeerConnection.addIceCandidate(candidate);
});
