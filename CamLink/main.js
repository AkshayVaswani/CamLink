import './style.css'
import firebase from 'firebase/app';
import 'firebase/firestore';

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKja5IuYS_5g-99Lsr1GznuC-cIanwq8A",
  authDomain: "camlink-6cdd9.firebaseapp.com",
  projectId: "camlink-6cdd9",
  storageBucket: "camlink-6cdd9.appspot.com",
  messagingSenderId: "1064408396364",
  appId: "1:1064408396364:web:fd10ff76d38bed99bd3ae9"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = app.firestore();

const servers = {
  iceServers:[
    {
      urls: ['stun:stun1.l.google.com:19302','stun:stun2.l.google:19302']
    },
  ],
  iceCandidatePoolSize: 10,
}

let pc  = new RTCPeerConnection();
let remoteStream = new MediaStream();

const callInput = document.getElementById('callInput');
const hangupButton = document.getElementById('hangupButton');
const remoteVideo = document.getElementById('remoteVideo');

pc.ontrack = (event) => {
  event.streams[0].getTracks().forEach((track) => {
    remoteStream.addTrack(track);
  });
};

remoteVideo.srcObject = remoteStream;

answerButton.onclick = async () => {

  const callID = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();
  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  answerButton.disabled = true;
  hangupButton.disabled = false;
  
};

hangupButton.onclick = () => {
  pc.close();
  hangupButton.disabled = true;
  answerButton.disabled = false;
}