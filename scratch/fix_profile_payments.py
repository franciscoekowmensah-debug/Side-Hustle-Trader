import re

profile_path = r"c:\Users\franc\Desktop\That\side-hustle-trader\profile.html"

with open(profile_path, "r", encoding="utf-8") as f:
    content = f.read()

# Build a robust regex to find the Add Payment Method block in headingThree
target_regex = r'<h5>Add\s+Payment\s+Method:</h5>.*?<select\s+id="payment-type".*?</select>.*?</div>.*?<div\s+class="mb-3">.*?<label\s+class="form-label">Provider</label>.*?</div>.*?<div\s+class="mb-3">.*?<label\s+class="form-label">Account/Card\s+Number\s+or\s+Crypto\s+Address</label>.*?</div>.*?<div\s+class="mb-3">.*?<label\s+class="form-label">Account\s+Holder\s+Name\s+/\s+Description</label>.*?</div>.*?<button\s+id="add-payment-btn".*?</button>'

replacement = """<h5>Add Payment Method:</h5>
                                         <div class="mb-3">
                                             <label class="form-label">Method Type</label>
                                             <select id="payment-type" class="form-control">
                                                 <option value="momo">Mobile Money (MoMo)</option>
                                                 <option value="card">Bank Card (Visa/Mastercard)</option>
                                                 <option value="crypto">Cryptocurrency Deposit</option>
                                             </select>
                                         </div>

                                         <!-- Mobile Money Fields -->
                                         <div id="momo-fields" class="payment-method-fields">
                                             <div class="mb-3">
                                                 <label class="form-label">MoMo Network Provider</label>
                                                 <select id="momo-provider" class="form-control">
                                                     <option value="MTN">MTN Mobile Money</option>
                                                     <option value="Telecel Cash">Telecel Cash</option>
                                                     <option value="AirtelTigo">AirtelTigo Cash</option>
                                                 </select>
                                             </div>
                                             <div class="mb-3">
                                                 <label class="form-label">MoMo Account Number</label>
                                                 <input type="text" id="momo-number" class="form-control" placeholder="e.g. 0244123456">
                                             </div>
                                             <div class="mb-3">
                                                 <label class="form-label">MoMo Account Name</label>
                                                 <input type="text" id="momo-name" class="form-control" placeholder="e.g. Samuel Amponsah">
                                             </div>
                                             <button id="add-momo-btn" class="btn btn-primary rounded-pill text-white py-2 px-4 w-100 mt-2">Save MoMo Account</button>
                                         </div>

                                         <!-- Bank Card Fields -->
                                         <div id="card-fields" class="payment-method-fields" style="display: none;">
                                             <div class="mb-3">
                                                 <label class="form-label">Card Provider</label>
                                                 <select id="card-provider" class="form-control">
                                                     <option value="Visa">Visa Card</option>
                                                     <option value="Mastercard">Mastercard</option>
                                                 </select>
                                             </div>
                                             <div class="mb-3">
                                                 <label class="form-label">Card Number</label>
                                                 <input type="text" id="card-number" class="form-control" placeholder="4111 2222 3333 4444">
                                             </div>
                                             <div class="mb-3">
                                                 <label class="form-label">Cardholder Name</label>
                                                 <input type="text" id="card-name" class="form-control" placeholder="e.g. John Doe">
                                             </div>
                                             <div class="row">
                                                 <div class="col-6 mb-3">
                                                     <label class="form-label">Expiry Date</label>
                                                     <input type="text" id="card-expiry" class="form-control" placeholder="MM/YY">
                                                 </div>
                                                 <div class="col-6 mb-3">
                                                     <label class="form-label">CVV</label>
                                                     <input type="password" id="card-cvv" class="form-control" placeholder="123" maxlength="3">
                                                 </div>
                                             </div>
                                             <button id="add-card-btn" class="btn btn-primary rounded-pill text-white py-2 px-4 w-100 mt-2">Save Card Details</button>
                                         </div>

                                         <!-- Crypto Fields -->
                                         <div id="crypto-fields" class="payment-method-fields" style="display: none;">
                                             <div class="alert alert-warning">
                                                 <p class="mb-1"><strong>Deposit Wallet Address:</strong></p>
                                                 <div class="input-group mb-2">
                                                     <input type="text" id="company-wallet-addr" class="form-control bg-light text-dark font-monospace" value="TYd45kLsmvW34mNZqEwLg3b1a8c90KjL92" readonly>
                                                     <button class="btn btn-outline-dark btn-sm" id="copy-wallet-btn">Copy</button>
                                                 </div>
                                                 <small class="text-dark">Send USDT (TRC-20) network token to this address. Fill in details below to confirm.</small>
                                             </div>
                                             <div class="mb-3">
                                                 <label class="form-label">Amount (GHC value to deposit)</label>
                                                 <input type="number" id="crypto-amount" class="form-control" placeholder="e.g. 500">
                                             </div>
                                             <button id="crypto-confirm-btn" class="btn btn-success rounded-pill text-white py-2 px-4 w-100 mt-2">I have paid</button>
                                         </div>"""

new_content, count = re.subn(target_regex, replacement, content, flags=re.DOTALL | re.IGNORECASE)
print(f"Substitutions made: {count}")

if count > 0:
    with open(profile_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Success: Updated profile.html payments form with dynamic fields")
else:
    print("Error: Target content not matched using regex")
