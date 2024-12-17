// import nodemailer from 'nodemailer';

// // Membuat transporter untuk mengirim email
// const transporter = nodemailer.createTransport({
//   host: 'smtp.zoho.com',
//   port: 465, // Gunakan port 465 untuk SSL atau 587 untuk TLS
//   secure: true, // true untuk port 465, false untuk port 587
//   auth: {
//     user: 'thriftease@zohomail.com', // Ganti dengan alamat email Zoho Anda
//     pass: '2AWG91hiB9e2',    // Ganti dengan App Password Zoho Anda
//   },
// });

// export default transporter;

import nodemailer from 'nodemailer';

// Buat transporter untuk Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail', // Gunakan service Gmail
  auth: {
    user: 'thriftease4315@gmail.com', // Ganti dengan alamat Gmail kamu
    pass: 'zsaf vbtk pxzb gbyu',   // Ganti dengan App Password dari Gmail
  },
});

export default transporter;