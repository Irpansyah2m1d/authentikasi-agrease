const admin = require('firebase-admin');

// Import Firebase Client SDK (gunakan firebase-admin untuk token generation)
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const firebase = require('firebase/app');
const sendEmail = require('../services/emailService');

// Firebase Client SDK Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIdYx3mGLxxuZeXz8cXhMew44g-0kQkf8",
    authDomain: "agresia-8d511.firebaseapp.com",
    projectId: "agresia-8d511",
    storageBucket: "agresia-8d511.firebasestorage.app",
    messagingSenderId: "679556135453",
    appId: "1:679556135453:web:863ad9fc854077caece4f4"
};

if (!firebase.getApps().length) {
    firebase.initializeApp(firebaseConfig);
}
// const auth = getAuth();
// console.log('Firebase initialized:', !!auth);
// const db = admin.firestore();










// Register User
const registerUser = async (request, h) => {
  const db = admin.firestore();
  const { email, password, displayName, phone, address } = request.payload;

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    function getRandomSixDigit() {
      return Math.floor(100000 + Math.random() * 900000);
    }

    let code = getRandomSixDigit();

    let link = process.env.BASE_URL;
    // const token = await admin.auth().createCustomToken(user.uid);
    // const tokenId = saveTokenToDatabase(token);
    link = link + "/verify/" + user.uid;
     // Kirim email verifikasi menggunakan layanan Fimail
     await sendEmail({
       fromName: 'Agrease Admin',
       fromAddress: 'irpansyah810@gmail.com',
       toName: displayName,
       toAddress: email,
       subject: 'Email Verification',
       content: `Hello ${displayName},\n\nPlease verify your email with the link:\n\n${link}\n\n  using the code:\n\n${code}\n\nThank you!\nAgrease Team`,
     });

    // Simpan data pengguna ke Firestore
    const userRef = db.collection('users-profile').doc(user.uid);

    await userRef.set({
      uid: user.uid,
      email: user.email,
      nama: user.displayName,
      phone: phone,
      address: address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'buyer',
      isVerified: code // Menandakan apakah user sudah memverifikasi emailnya
   });

     // Buat link verifikasi email
    //  const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    // let link = process.env.BASE_URL;
    // const token = await admin.auth().createCustomToken(user.uid);
    // const tokenId = saveTokenToDatabase(token);
    // link = link + "/verify/" + tokenId;

    
    return h.response({ success: true, message: 'User registered successfully', uid: user.uid }).code(201);
  } catch (error) {
    return h.response({ error: error.message }).code(400);
  }
};








// Login User
const loginUser = async (request, h) => {
  const db = admin.firestore();
  const { email, password } = request.payload;

  // Cek apakah sudah verifikasi atau belum
  const userRef = db.collection('users-profile');
  const doc = await userRef.where('email', '==', email).get();


  if (doc._size < 1) {
    console.log('Email Belum Terdaftar.');
    return h.response({ success: false, err: "Email Kamu Belum Terdaftar." }).code(404);
  }
  // console.log(doc);
  // Simpan data dalam variabel
  let userData = null;

  doc.forEach(d => {
    userData = {  ...d.data() }; // Gabungkan ID dokumen dengan data
  });
  // Mengambil data dari field tertentu
  // const userData = doc.data();
  const fieldValue = userData.isVerified;

  

  if (fieldValue === true) {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Generate custom token with Firebase Admin SDK
      // const token = await admin.auth().createCustomToken(user.uid);
  
      return h.response({ success: true, message: 'Login successful', data: userData }).code(200);
    } catch (error) {
      return h.response({success: false, error: error.message }).code(400);
    }

 }else {
    console.log('Email Belum Terverifikasi.');
    return h.response({ success: false, err: "Email Kamu Belum Terverifikasi." }).code(400);
 }

 
};





// Verify Token
const verifyToken = async (request, h) => {
  const db = admin.firestore();
  

  const { userid } = request.params;
  const {codeOTP} = request.payload;
  // const tokenBenar = await getTokenFromDatabase(token); // Mengambil token yang sesuai
  // console.log(tokenBenar);

  try {
    const userRef = db.collection('users-profile').doc(userid);
    const doc = await userRef.get();

    // Mengecek apakah dokumen ditemukan
    if (!doc.exists) {
      console.log('Data tidak ditemukan/Url Kamu Salah');
      return h.response({ success: false, err: "Data Tidak Ditemukan/Url Kamu Salah" }).code(404);
    }


       // Mengambil data dari field tertentu
       const userData = doc.data();
       const fieldValue = userData.isVerified;  // Ganti 'fieldName' dengan nama field yang ingin diperiksa
   
       // Melakukan pengecekan nilai field
       if (fieldValue === codeOTP) {
          try {
            // Jika OTP benar, update field 'isVerified' menjadi true
            await userRef.update({
              isVerified: true
            });
            console.log('Verifikasi berhasil dan field isVerified diperbarui!');
        
            return h.response({ success: true, message: "Verifikasi Berhasil!.", uid: userid }).code(200);
          } catch (error) {
            console.error('Error updating field: ', error);
            return h.response({ success: false, err: "Gagal memperbarui status verifikasi" }).code(500);
          }

       } else {
         console.log('Kode OTP salah');
         return h.response({ success: false, err: "Kode OTP kamu Salah." }).code(400);
       }
    // const decodedToken = await admin.auth().verifyIdToken(tokenBenar);
    // return h.response({ uid: decodedToken.uid, email: decodedToken.email }).code(200);
  } catch (error) {
    return h.response({ success: false, error: 'Invalid token' }).code(400);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
};
