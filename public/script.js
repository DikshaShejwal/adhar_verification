let sessionId = null;

document.addEventListener("DOMContentLoaded", () => {
  const sendOtpBtn = document.getElementById("sendOtp");
  const confirmOtpBtn = document.getElementById("confirmOtp");

  sendOtpBtn.addEventListener("click", async () => {
    const file = document.getElementById("aadhaarImage").files[0];
    const aadhaarNumber = document.getElementById("aadhaarNumber").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const resp = document.getElementById("resp");

    resp.className = "msg hidden";

    if (!file) {
      resp.textContent = "Please upload an image";
      resp.className = "msg error";
      return;
    }
    if (!aadhaarNumber) {
      resp.textContent = "Please enter Aadhaar number";
      resp.className = "msg error";
      return;
    }

    const form = new FormData();
    form.append("aadhaarImage", file);
    form.append("aadhaarNumber", aadhaarNumber);
    if (phone) form.append("phone", phone);

    try {
      const r = await fetch("/api/verify-aadhaar", { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok) {
        resp.textContent = j.error || j.message || "Verification failed";
        resp.className = "msg error";
        return;
      }
      resp.textContent = j.message || "OTP sent";
      resp.className = "msg ok";
      sessionId = j.sessionId;
      document.getElementById("step2").classList.remove("hidden");
    } catch (err) {
      resp.textContent = "Network error";
      resp.className = "msg error";
    }
  });

  confirmOtpBtn.addEventListener("click", async () => {
    const otp = document.getElementById("otpInput").value.trim();
    const resp2 = document.getElementById("resp2");

    resp2.className = "msg hidden";
    if (!otp) {
      resp2.textContent = "Enter OTP";
      resp2.className = "msg error";
      return;
    }
    if (!sessionId) {
      resp2.textContent = "Session missing. Try again.";
      resp2.className = "msg error";
      return;
    }

    try {
      const r = await fetch("/api/confirm-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp })
      });
      const j = await r.json();
      if (!r.ok) {
        resp2.textContent = j.error || j.message || "OTP verification failed";
        resp2.className = "msg error";
        return;
      }
      resp2.textContent = j.message || "Verified";
      resp2.className = "msg ok";
    } catch (err) {
      resp2.textContent = "Network error";
      resp2.className = "msg error";
    }
  });
});
