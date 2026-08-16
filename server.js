const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'side-hustle-trader-super-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Route guard middleware for secure static pages
const securePages = ['/home.html', '/profile.html', '/invest.html', '/invite.html', '/admin.html'];
app.use((req, res, next) => {
    const isSecurePath = securePages.some(page => req.path.endsWith(page) || req.path === page);
    
    if (isSecurePath && !req.session.userId) {
        return res.redirect('/login.html');
    }
    
    if (req.path.endsWith('/login.html') && req.session.userId) {
        return res.redirect('/home.html');
    }

    if ((req.path.endsWith('/admin.html') || req.path === '/admin.html') && req.session.userId) {
        db.get(`SELECT is_admin FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
            if (err || !user || !user.is_admin) {
                return res.redirect('/home.html');
            }
            next();
        });
        return;
    }
    
    next();
});

// Serve static directory files
app.use(express.static(path.join(__dirname)));

// API Routes

// Registration Endpoint
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Encryption error.' });
        }
        
        const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
        db.run(sql, [name, email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email already exists.' });
                }
                return res.status(500).json({ error: 'Registration failed.' });
            }
            
            // Log user in automatically after register
            req.session.userId = this.lastID;
            
            // Process referral if referrerId is provided and is not the registering user themselves
            const { referrerId } = req.body;
            if (referrerId && Number(referrerId) !== this.lastID) {
                db.run(`UPDATE users SET invites_count = invites_count + 1 WHERE id = ?`, [referrerId], function(err) {
                    if (!err) {
                        // Retrieve the new invites_count to dynamically update tier
                        db.get(`SELECT invites_count FROM users WHERE id = ?`, [referrerId], (err, row) => {
                            if (!err && row) {
                                const newCount = row.invites_count;
                                let newTier = 'Level 1';
                                if (newCount >= 12) newTier = 'Level 5';
                                else if (newCount >= 8) newTier = 'Level 4';
                                else if (newCount >= 4) newTier = 'Level 3';
                                else if (newCount >= 1) newTier = 'Level 2';
                                
                                db.run(`UPDATE users SET tier_level = ? WHERE id = ?`, [newTier, referrerId]);
                            }
                        });
                    }
                });
            }
            
            res.json({ success: true, message: 'Registration successful!' });
        });
    });
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    
    const sql = `SELECT * FROM users WHERE email = ? OR name = ?`;
    db.get(sql, [email, email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Server error during sign in.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        
        bcrypt.compare(password, user.password, (err, matches) => {
            if (err || !matches) {
                return res.status(400).json({ error: 'Invalid email or password.' });
            }
            
            req.session.userId = user.id;
            // Return admin flag so the frontend can redirect admins to the admin dashboard
            res.json({ success: true, message: 'Logged in successfully!', is_admin: !!user.is_admin });
        });
    });
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// User Session Check and Profile Info
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const userSql = `SELECT id, name, email, first_name, last_name, phone, dob, country, avatar, nickname, tier_level, balance, earnings, invites_count, is_admin FROM users WHERE id = ?`;
    
    db.get(userSql, [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        // Retrieve payment methods
        db.all(`SELECT * FROM payment_methods WHERE user_id = ?`, [user.id], (err, methods) => {
            user.payment_methods = methods || [];
            
            // Retrieve investments
            db.all(`SELECT * FROM investments WHERE user_id = ? ORDER BY date_created DESC`, [user.id], (err, investments) => {
                user.investments = investments || [];
                
                // Retrieve withdrawals
                db.all(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY date_created DESC`, [user.id], (err, withdrawals) => {
                    user.withdrawals = withdrawals || [];
                    res.json({ success: true, user });
                });
            });
        });
    });
});

// Update Profile
app.post('/api/profile/update', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const { first_name, last_name, phone, dob, country, nickname } = req.body;
    
    const sql = `UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        dob = COALESCE(?, dob),
        country = COALESCE(?, country),
        nickname = COALESCE(?, nickname)
        WHERE id = ?`;
        
    db.run(sql, [first_name, last_name, phone, dob, country, nickname, req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update profile.' });
        }
        res.json({ success: true, message: 'Profile updated successfully!' });
    });
});

// Save Payment Option
app.post('/api/payment/save', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const { method_type, provider, account_number, account_name, expiry_date, cvv } = req.body;
    
    if (!method_type || !provider || !account_number || !account_name) {
        return res.status(400).json({ error: 'All primary payment method fields are required.' });
    }
    
    const sql = `INSERT INTO payment_methods (user_id, method_type, provider, account_number, account_name, expiry_date, cvv) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [req.session.userId, method_type, provider, account_number, account_name, expiry_date || null, cvv || null], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to save payment option.' });
        }
        res.json({ success: true, id: this.lastID, message: 'Payment option saved successfully!' });
    });
});

// Delete Payment Option
app.post('/api/payment/delete/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const sql = `DELETE FROM payment_methods WHERE id = ? AND user_id = ?`;
    db.run(sql, [req.params.id, req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete payment option.' });
        }
        res.json({ success: true, message: 'Payment option deleted.' });
    });
});

// Make an Investment
app.post('/api/invest', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const { plan_name, amount } = req.body;
    const planAmount = parseFloat(amount);
    
    if (!plan_name || isNaN(planAmount) || planAmount <= 0) {
        return res.status(400).json({ error: 'Invalid investment details.' });
    }
    
    // Check balance first
    db.get(`SELECT balance FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: 'Failed to retrieve user.' });
        }
        
        if (user.balance < planAmount) {
            return res.status(400).json({ error: 'Insufficient balance to invest in this plan.' });
        }
        
        // Calculate dynamic daily yield returns (e.g. 5% daily return)
        const dailyReturn = parseFloat((planAmount * 0.05).toFixed(2));
        
        db.serialize(() => {
            // Deduct balance
            db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [planAmount, req.session.userId]);
            
            // Insert investment
            db.run(`INSERT INTO investments (user_id, plan_name, amount, daily_return) VALUES (?, ?, ?, ?)`, 
                [req.session.userId, plan_name, planAmount, dailyReturn]);
                
            res.json({ success: true, message: `Successfully invested GHC ${planAmount} in ${plan_name} plan!` });
        });
    });
});

// Request a Withdrawal
app.post('/api/withdraw', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const { amount } = req.body;
    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount.' });
    }
    
    db.get(`SELECT balance FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: 'Failed to retrieve user.' });
        }
        
        if (user.balance < withdrawAmount) {
            return res.status(400).json({ error: 'Insufficient balance for this withdrawal.' });
        }
        
        db.serialize(() => {
            // Deduct balance
            db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [withdrawAmount, req.session.userId]);
            
            // Create withdrawal transaction
            db.run(`INSERT INTO withdrawals (user_id, amount, status) VALUES (?, ?, 'completed')`, 
                [req.session.userId, withdrawAmount]);
                
            res.json({ success: true, message: `Successfully withdrew GHC ${withdrawAmount}!` });
        });
    });
});

// Daily yield simulation trigger (increments balance and earnings based on active investments)
app.post('/api/earnings/tick', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    // Find active investments for this user
    db.all(`SELECT SUM(daily_return) as total_return FROM investments WHERE user_id = ?`, [req.session.userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Simulation failed.' });
        }
        
        const totalReturn = row[0]?.total_return || 0;
        if (totalReturn > 0) {
            db.run(`UPDATE users SET balance = balance + ?, earnings = earnings + ? WHERE id = ?`, 
                [totalReturn, totalReturn, req.session.userId], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Simulation update failed.' });
                    }
                    res.json({ success: true, added: totalReturn, message: `Simulated daily returns added: GHC ${totalReturn}` });
                });
        } else {
            res.json({ success: true, added: 0, message: 'No active investments to generate yields. Please invest first!' });
        }
    });
});

// Crypto Deposit Confirmation ("I have paid")
app.post('/api/deposit/crypto', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const { amount, wallet_address } = req.body;
    const depAmount = parseFloat(amount);
    
    if (isNaN(depAmount) || depAmount <= 0 || !wallet_address) {
        return res.status(400).json({ error: 'Invalid deposit amount or wallet address.' });
    }
    
    // Record deposit with 'pending' status. DO NOT credit user balance yet.
    db.run(`INSERT INTO deposits (user_id, amount, wallet_address, status) VALUES (?, ?, ?, 'pending')`,
        [req.session.userId, depAmount, wallet_address], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to submit deposit confirmation.' });
            }
            res.json({ success: true, message: `Deposit request submitted! Once approved by the administrator, GHC ${depAmount} will reflect in your balance.` });
        }
    );
});

// Change Password Endpoint
app.post('/api/profile/change-password', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    
    db.get(`SELECT password FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: 'Failed to retrieve user.' });
        }
        
        bcrypt.compare(current_password, user.password, (err, matches) => {
            if (err || !matches) {
                return res.status(400).json({ error: 'Incorrect current password.' });
            }
            
            bcrypt.hash(new_password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: 'Encryption error.' });
                }
                
                db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, req.session.userId], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to update password.' });
                    }
                    res.json({ success: true, message: 'Password updated successfully!' });
                });
            });
        });
    });
});

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    db.get(`SELECT is_admin FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err || !user || !user.is_admin) {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
        next();
    });
};

// Admin check for frontend
app.get('/api/admin/check', isAdmin, (req, res) => {
    res.json({ success: true, message: 'Admin verified.' });
});

// Get all users
app.get('/api/admin/users', isAdmin, (req, res) => {
    db.all(`SELECT id, name, email, first_name, last_name, phone, dob, country, avatar, nickname, tier_level, balance, earnings, invites_count, is_admin FROM users ORDER BY name ASC`, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve users.' });
        }
        res.json({ success: true, users });
    });
});

// Get a single user details (with investments, withdrawals, deposits, payment methods)
app.get('/api/admin/users/:id', isAdmin, (req, res) => {
    const userId = req.params.id;
    db.get(`SELECT id, name, email, first_name, last_name, phone, dob, country, avatar, nickname, tier_level, balance, earnings, invites_count, is_admin FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        db.all(`SELECT * FROM payment_methods WHERE user_id = ?`, [userId], (err, payment_methods) => {
            db.all(`SELECT * FROM investments WHERE user_id = ? ORDER BY date_created DESC`, [userId], (err, investments) => {
                db.all(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY date_created DESC`, [userId], (err, withdrawals) => {
                    db.all(`SELECT * FROM deposits WHERE user_id = ? ORDER BY date_created DESC`, [userId], (err, deposits) => {
                        res.json({
                            success: true,
                            user: {
                                ...user,
                                payment_methods: payment_methods || [],
                                investments: investments || [],
                                withdrawals: withdrawals || [],
                                deposits: deposits || []
                            }
                        });
                    });
                });
            });
        });
    });
});

// Delete user account
app.delete('/api/admin/users/:id', isAdmin, (req, res) => {
    const userId = req.params.id;
    if (Number(userId) === req.session.userId) {
        return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete user.' });
        }
        res.json({ success: true, message: 'User account successfully deleted.' });
    });
});

// Get all deposits
app.get('/api/admin/deposits', isAdmin, (req, res) => {
    const sql = `
        SELECT deposits.*, users.name as user_name, users.email as user_email
        FROM deposits
        JOIN users ON deposits.user_id = users.id
        ORDER BY deposits.date_created DESC
    `;
    db.all(sql, (err, deposits) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve deposits.' });
        }
        res.json({ success: true, deposits });
    });
});

// Approve a deposit
app.post('/api/admin/deposits/approve/:id', isAdmin, (req, res) => {
    const depositId = req.params.id;
    db.get(`SELECT * FROM deposits WHERE id = ?`, [depositId], (err, deposit) => {
        if (err || !deposit) {
            return res.status(404).json({ error: 'Deposit record not found.' });
        }
        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Deposit has already been processed.' });
        }
        
        db.serialize(() => {
            // Update deposit status to completed
            db.run(`UPDATE deposits SET status = 'completed' WHERE id = ?`, [depositId]);
            // Credit user balance
            db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [deposit.amount, deposit.user_id], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to credit user balance.' });
                }
                res.json({ success: true, message: `Deposit approved! GHC ${deposit.amount} has been credited to the user.` });
            });
        });
    });
});

// Reject a deposit
app.post('/api/admin/deposits/reject/:id', isAdmin, (req, res) => {
    const depositId = req.params.id;
    db.get(`SELECT * FROM deposits WHERE id = ?`, [depositId], (err, deposit) => {
        if (err || !deposit) {
            return res.status(404).json({ error: 'Deposit record not found.' });
        }
        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Deposit has already been processed.' });
        }
        
        db.run(`UPDATE deposits SET status = 'rejected' WHERE id = ?`, [depositId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to reject deposit.' });
            }
            res.json({ success: true, message: 'Deposit confirmation rejected successfully.' });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
