const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');

/**
 * Public Webhook Endpoints
 * These are called by GCash, PayPal, or our simulation logic.
 * THEY DO NOT REQUIRE AUTHENTICATION (Auth is verified via payload signatures in production).
 */

// POST /webhooks/confirm
// Used to notify the system of a successful payment
router.post('/confirm', BillingController.confirmPayment);

/**
 * Dynamic Redirect Simulator (GCash/PayPal "App" simulation)
 */
router.get('/payment-sim/:provider', (req, res) => {
    const { provider } = req.params;
    const { user_id, amount } = req.query;

    res.send(`
        <html>
            <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f7ff;">
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; width: 350px;">
                    <h2 style="color: #007bff;">${provider.toUpperCase()} Checkout</h2>
                    <p style="color: #666;">This is a simulated ${provider} interface.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 1.5rem 0;">
                    <p style="font-size: 1.2rem;">Total: <b>PHP ${amount}</b></p>
                    <button onclick="pay()" style="background: #007bff; color: white; border: none; padding: 1rem 1.5rem; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 1rem;">Complete Payment</button>
                    <p id="msg" style="margin-top: 1rem; color: #28a745; display: none;">✅ Processing successful...</p>
                </div>

                <script>
                    async function pay() {
                        const btn = document.querySelector('button');
                        const msg = document.getElementById('msg');
                        btn.disabled = true;
                        btn.innerText = 'Notifying GCash/PayPal...';
                        
                        try {
                            // Pointing to the PUBLIC webhook endpoint
                            const resp = await fetch('/webhooks/confirm', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: '${user_id}',
                                    provider: '${provider}',
                                    amount: '${amount}',
                                    token: 'NATIVE_' + Date.now()
                                })
                            });
                            
                            const data = await resp.json();
                            if (data.success) {
                                msg.style.display = 'block';
                                setTimeout(() => {
                                    window.location.href = '/dashboard?upgrade=success';
                                }, 1500);
                            } else {
                                alert('Error: ' + data.error);
                                btn.disabled = false;
                                btn.innerText = 'Retry Payment';
                            }
                        } catch (err) {
                            alert('Network error. Check server status.');
                            btn.disabled = false;
                            btn.innerText = 'Retry Payment';
                        }
                    }
                </script>
            </body>
        </html>
    `);
});

module.exports = router;
