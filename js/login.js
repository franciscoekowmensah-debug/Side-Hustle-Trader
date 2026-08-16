let switchCtn = document.querySelector("#switch-cnt");
let switchC1 = document.querySelector("#switch-c1");
let switchC2 = document.querySelector("#switch-c2");
let switchCircle = document.querySelectorAll(".switch__circle");
let switchBtn = document.querySelectorAll(".switch-btn");
let aContainer = document.querySelector("#a-container");
let bContainer = document.querySelector("#b-container");

let changeForm = (e) => {
    switchCtn.classList.add("is-gx");
    setTimeout(function(){
        switchCtn.classList.remove("is-gx");
    }, 1500)

    switchCtn.classList.toggle("is-txr");
    switchCircle[0].classList.toggle("is-txr");
    switchCircle[1].classList.toggle("is-txr");

    switchC1.classList.toggle("is-hidden");
    switchC2.classList.toggle("is-hidden");
    aContainer.classList.toggle("is-txl");
    bContainer.classList.toggle("is-txl");
    bContainer.classList.toggle("is-z200");
}

let mainF = (e) => {
    for (var i = 0; i < switchBtn.length; i++)
        switchBtn[i].addEventListener("click", changeForm);

    // Sign Up Form Submission
    const signupForm = document.getElementById('a-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Registration successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/profile.html';
                    }, 1200);
                } else {
                    showToast(data.error || 'Registration failed.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('An error occurred during registration.', 'error');
            });
        });
    }

    // Sign In Form Submission
    const signinForm = document.getElementById('b-form');
    if (signinForm) {
        signinForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;

            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Logged in successfully! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/home.html';
                    }, 1000);
                } else {
                    showToast(data.error || 'Invalid credentials.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('An error occurred during login.', 'error');
            });
        });
    }
}

window.addEventListener("load", mainF);
