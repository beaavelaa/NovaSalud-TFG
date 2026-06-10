const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCVRY3bL2ia7RUAZbh1tjd9UqjP89__YhI",
  authDomain: "trabajoinvestigacion-807e3.firebaseapp.com",
  projectId: "trabajoinvestigacion-807e3",
  storageBucket: "trabajoinvestigacion-807e3.appspot.com",
  messagingSenderId: "2139927862",
  appId: "1:2139927862:web:e5a1474bb2dadbc798af97",
  measurementId: "G-CH4N0W0YZD"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

module.exports = db;
