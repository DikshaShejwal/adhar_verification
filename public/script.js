document.addEventListener('DOMContentLoaded', () => {

  // ----- Aadhaar -----
  const aadhaarImage = document.getElementById('aadhaarImage');
  const aadhaarNumberInput = document.getElementById('aadhaarNumber');
  const sendOtpBtn = document.getElementById('sendOtp');
  const resp = document.getElementById('resp');

  const step2 = document.getElementById('step2');
  const otpInput = document.getElementById('otpInput');
  const confirmOtpBtn = document.getElementById('confirmOtp');
  const resp2 = document.getElementById('resp2');
  const aadhaarCard = document.getElementById('aadhaarCard');
  const aadhaarOutNumber = document.getElementById('aadhaarOutNumber');
  const aadhaarOutName = document.getElementById('aadhaarOutName');

  let aadhaarSessionId = null;

  // Send Aadhaar OTP
  sendOtpBtn.addEventListener('click', async () => {
    if (!aadhaarImage.files.length) return alert("Please select Aadhaar image");

    const formData = new FormData();
    formData.append('file', aadhaarImage.files[0]);

    try {
      const res = await fetch('/api/aadhaar/verify-aadhaar', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      console.log("VERIFY AADHAAR RESPONSE:", JSON.stringify(data, null, 2));

      if (data.success) {
        aadhaarSessionId = data.sessionId;
        resp.textContent = data.message;
        resp.className = 'msg ok';
        resp.classList.remove('hidden');
        step2.classList.remove('hidden');
      } else {
        resp.textContent = data.error || "Verification failed";
        resp.className = 'msg error';
        resp.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading Aadhaar");
    }
  });

  // Confirm Aadhaar OTP
  confirmOtpBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();
    if (!otp) return alert("Enter OTP");

    try {
      const res = await fetch('/api/aadhaar/confirm-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: aadhaarSessionId, otp })
      });
      const data = await res.json();
      console.log("CONFIRM AADHAAR RESPONSE:", JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        aadhaarOutNumber.textContent = data.data.number;
        aadhaarOutName.textContent = data.data.name;
        aadhaarCard.classList.remove('hidden');
        resp2.textContent = data.message;
        resp2.className = 'msg ok';
        resp2.classList.remove('hidden');
      } else {
        resp2.textContent = data.error || "OTP verification failed";
        resp2.className = 'msg error';
        resp2.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      alert("Error confirming Aadhaar OTP");
    }
  });

  // ----- PAN -----
  const panImage = document.getElementById('panImage');
  const sendPanOtpBtn = document.getElementById('sendPanOtp');
  const panResp = document.getElementById('panResp');

  const panStep2 = document.getElementById('panStep2');
  const panOtpInput = document.getElementById('panOtpInput');
  const confirmPanOtpBtn = document.getElementById('confirmPanOtp');
  const panResp2 = document.getElementById('panResp2');
  const panCard = document.getElementById('panCard');
  const panOutNumber = document.getElementById('panOutNumber');
  const panOutName = document.getElementById('panOutName');

  let panSessionId = null;

  // Send PAN OTP
  sendPanOtpBtn.addEventListener('click', async () => {
    if (!panImage.files.length) return alert("Please select PAN image");

    const formData = new FormData();
    formData.append('file', panImage.files[0]);

    try {
      const res = await fetch('/api/pan/verify-pan', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      console.log("VERIFY PAN RESPONSE:", JSON.stringify(data, null, 2));

      if (data.success) {
        panSessionId = data.sessionId;
        panResp.textContent = data.message;
        panResp.className = 'msg ok';
        panResp.classList.remove('hidden');
        panStep2.classList.remove('hidden');
      } else {
        panResp.textContent = data.error || "Verification failed";
        panResp.className = 'msg error';
        panResp.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading PAN");
    }
  });

  // Confirm PAN OTP
  confirmPanOtpBtn.addEventListener('click', async () => {
    const otp = panOtpInput.value.trim();
    if (!otp) return alert("Enter OTP");

    try {
      const res = await fetch('/api/pan/confirm-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: panSessionId, otp })
      });
      const data = await res.json();
      console.log("CONFIRM PAN RESPONSE:", JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        panOutNumber.textContent = data.data.number;
        panOutName.textContent = data.data.name;
        panCard.classList.remove('hidden');
        panResp2.textContent = data.message;
        panResp2.className = 'msg ok';
        panResp2.classList.remove('hidden');
      } else {
        panResp2.textContent = data.error || "OTP verification failed";
        panResp2.className = 'msg error';
        panResp2.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      alert("Error confirming PAN OTP");
    }
  });

});
