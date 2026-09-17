# GlauCat 

GlauCat is a web-based eye health screening prototype that explores how interactive vision tests, webcam-based eye tracking, and simple scoring can be combined into one application.

The idea was to go beyond a basic image-upload-and-predict type of project. Instead, GlauCat provides a complete flow where a user can perform different visual tests, receive scores, and view the results together through a dashboard.

The project currently focuses on **glaucoma and cataract-related visual assessment**, with additional experimentation around real-time eye movement tracking.

> **Note:** GlauCat is an educational/student project and is not a clinically validated medical screening or diagnostic system.

---

## What GlauCat Does

The application is built around three main interactive assessments:

1. **Visual Field Test** for the glaucoma assessment
2. **Contrast Test** for the cataract assessment
3. **Eye Movement Test** using webcam-based facial landmarks

The results from these tests are then carried into a shared assessment flow and displayed on the dashboard.

```text
                    ┌─────────────────┐
                    │    GlauCat      │
                    │      Home       │
                    └────────┬────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Vision Simulator   │
                  └─────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
       Visual Field    Contrast Test   Eye Movement
           Test                            Test
             │              │              │
             ▼              ▼              ▼
      Glaucoma Score  Cataract Score   Movement Result
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                  ┌──────────────────┐
                  │  Shared Context  │
                  │     Scores       │
                  └────────┬─────────┘
                           ▼
                  ┌──────────────────┐
                  │     Dashboard    │
                  └──────────────────┘
```

---

## Main Features

### 1. Glaucoma Visual Field Test

The visual-field test is designed as a simple reaction-based peripheral vision simulation.

A dot appears at different positions on the test area after a random delay. The user has to click the dot as soon as they notice it.

The test keeps track of:

* Number of trials
* Missed targets
* Individual reaction times
* Average reaction time
* Final test score

The number of trials and maximum reaction time can be adjusted before starting the test.

The score is calculated using the test performance rather than simply counting correct answers.

For example, the implementation takes both **misses and average reaction time** into account when generating the final score.

```text
Visual Field Test
       │
       ├── Random target appears
       │
       ├── User responds
       │
       ├── Reaction time recorded
       │
       ├── Misses counted
       │
       └── Final score calculated
```

The result is then passed back to the main Vision Simulator and stored as the glaucoma score.

---

### 2. Adaptive Contrast Test

The cataract side of the application contains a more involved contrast-testing component.

Instead of showing the same difficulty throughout the test, the component changes difficulty depending on the user's previous response.

It contains different types of visual plates:

* Grating patterns
* Noise-based plates
* Low-contrast numbers

The test also includes a calibration step so the user can adjust the size of the visual plates according to their viewing distance and screen.

### Adaptive difficulty

The test uses a simple **1-up/1-down staircase approach**.

```text
             Start
               │
               ▼
        Show visual plate
               │
          User answers
          /           \
       Correct       Incorrect
          │              │
          ▼              ▼
     Increase         Decrease
     difficulty       difficulty
          │              │
          └──────┬───────┘
                 ▼
            Next trial
```

A correct answer increases the difficulty level, while an incorrect answer decreases it.

The component records the responses and calculates a final score from the user's performance across the test.

---

## 3. Webcam Eye Movement Tracking

One of the more experimental parts of GlauCat is the eye movement assessment.

The application uses the browser camera along with **MediaPipe Face Mesh** to detect facial landmarks.

The tracker:

* Requests webcam permission
* Captures the user's camera feed
* Detects facial landmarks
* Estimates the position of both eyes
* Performs an initial calibration
* Establishes a baseline eye position
* Tracks movement relative to that baseline
* Checks movement in four directions

  * Left
  * Right
  * Up
  * Down
* Displays a live tracking overlay
* Produces a simple result at the end of the test

The application uses eye landmark groups to calculate approximate eye-centre positions and compares their movement against the calibrated baseline.

```text
             Webcam
                │
                ▼
        MediaPipe Face Mesh
                │
                ▼
        Facial Landmarks
                │
                ▼
          Eye Positions
                │
                ▼
            Calibration
                │
                ▼
       Compare Movement
        with Baseline
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
      Left    Right    Up/Down
                │
                ▼
        Movement Result
```

The processing is performed in the browser using the webcam stream and Canvas overlay.

---

## 4. Risk Assessment

GlauCat also contains a separate risk-assessment page.

The current implementation allows glaucoma and cataract scores to be entered and reviewed through a step-by-step flow.

The scores are maintained using a shared React Context rather than keeping independent copies of the values on every page.

This allows the application to move information between the Vision Simulator, Risk Assessment and Dashboard.

---

## 5. Dashboard

The dashboard brings the assessment information together in one place.

It currently provides:

* Glaucoma score
* Cataract score
* Score-based severity interpretation
* Camera access
* Step-by-step assessment flow
* Assessment summary
* Recommendations based on the application's scoring logic

The dashboard also allows the assessment to be restarted or the stored scores to be reset.

---

# Technical Implementation

## Shared State with React Context

The project uses a dedicated `ScoreContext` to store:

```text
glaucomaScore
cataractScore
```

The vision tests update these values after completion.

Other parts of the application can then access the same values without passing them manually through multiple components.

This was useful because the assessment is split across different routes/components but still needs to behave like one continuous workflow.

---

## Client-Side Camera Handling

The camera functionality uses the browser's:

```javascript
navigator.mediaDevices.getUserMedia()
```

API.

The application starts the camera when required and stops the media tracks when the camera is turned off or the component is cleaned up.

This prevents the webcam from continuing to run after the user has finished the test.

---

## MediaPipe Integration

The eye tracking component uses MediaPipe Face Mesh to obtain facial landmarks.

The implementation:

1. Loads Face Mesh in the browser.
2. Starts the webcam.
3. Processes video frames.
4. Extracts relevant eye landmarks.
5. Calculates approximate eye-centre positions.
6. Establishes a baseline during calibration.
7. Measures normalized movement from that baseline.
8. Counts directional movements.
9. Produces the final movement result.

The tracking overlay is drawn using an HTML Canvas element on top of the video.

---

## SVG-Based Visual Tests

The contrast test generates its visual plates using SVG rather than relying only on static image files.

This makes it possible to change parameters such as:

* Contrast
* Scale
* Orientation
* Difficulty
* Plate type

during the test.

The current implementation includes grating, noise and low-contrast number patterns.

---

# Tech Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* CSS / CSS Modules

### Computer Vision

* MediaPipe Face Mesh
* Browser Camera API
* HTML Canvas

### Application Logic

* React Hooks
* React Context API
* SVG rendering
* Client-side state management

### Development

* npm
* TypeScript
* ESLint
* PostCSS
* Tailwind CSS configuration

---

# Project Structure

```text
GlauCat/
│
├── app/
│   │
│   ├── components/
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── style.module.css
│   │
│   ├── context/
│   │   └── ScoreContext.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── risk-assessment/
│   │   └── page.tsx
│   │
│   ├── vision-simulator/
│   │   ├── ContrastTest.tsx
│   │   ├── FieldTest.tsx
│   │   ├── IrisTracker.tsx
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── public/
│
├── inference_server.py
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── eslint.config.mjs
```

---

# Running the Project

## 1. Clone the repository

```bash
git clone https://github.com/Kothamrita/GlauCat.git
cd GlauCat
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

For the eye movement test, the browser will ask for permission to access the camera.

## 4. Production build

```bash
npm run build
npm start
```

---

# Why I Built GlauCat

I wanted to experiment with a problem where the frontend itself could be part of the solution instead of just being a wrapper around a model.

While building GlauCat, I worked with several different areas at the same time:

* Real-time webcam input
* Computer vision
* Facial landmarks
* Interactive visual testing
* Reaction-time measurement
* Adaptive difficulty
* React state management
* Multi-step user flows

The eye movement tracker was particularly interesting because it required dealing with real-time camera frames and making the system work despite differences in positioning and movement. That's why the tracker includes an initial calibration stage rather than assuming that everyone's eyes will start at exactly the same coordinates.

The project also made me think about the difference between something that works as a software prototype and something that would actually be suitable for clinical use.

---

# Current Limitations

GlauCat is currently a prototype, so there are several limitations.

### Clinical validation

The tests implemented here are experimental simulations and are **not replacements for clinically validated ophthalmic tests**.

### Scoring

The scoring formulas are application-level prototype logic and have not been clinically validated.

### Eye tracking

The eye movement feature uses facial landmarks as an approximation of eye movement. It is not equivalent to a dedicated clinical eye-tracking device.

### Device differences

Camera quality, lighting, screen size, viewing distance and browser performance can all affect the experience.

### Machine Learning

The current repository does **not** contain the previous ML inference implementation. The existing `inference_server.py` is only a placeholder, so the current version should not be described as having a deployed ML prediction backend.

---

# What I Learned

Building GlauCat helped me get practical experience with several things that are easy to understand in theory but considerably different when implemented.

### Frontend

* Building multi-step flows with Next.js
* Managing client-side state
* Sharing state using React Context
* Structuring a larger React application into independent components

### Computer Vision

* Working with webcam streams
* Using MediaPipe Face Mesh
* Working with facial landmarks
* Performing calibration
* Processing frames in real time
* Drawing tracking information over video using Canvas

### Interactive Testing

* Recording reaction times
* Handling asynchronous events
* Designing randomized visual-field trials
* Creating adaptive difficulty
* Generating visual plates using SVG

### Product Thinking

The biggest thing I learned was that building a working feature is only one part of the problem. For something related to healthcare, the assumptions behind the scoring, reliability of the test and validation process matter just as much as the code.

---

# Future Improvements

Some areas I would like to explore further are:

* Better calibration across different devices
* More robust eye landmark tracking
* Improved mobile support
* More extensive testing under different lighting conditions
* Better accessibility
* Persistent user assessment history
* Stronger validation of the scoring methodology
* Integration with a properly validated ML model
* More comprehensive testing and error handling

---

# Disclaimer

GlauCat is an educational software project created for experimentation and learning.

It does **not** provide a medical diagnosis, and its results should not be used to make healthcare decisions. Anyone experiencing vision problems or receiving a concerning result should consult a qualified eye-care professional.

---

## Author

**Kothamrita Chakraborty**

B.Tech Computer Science & Engineering

Interests: Web Development • Computer Vision • AI/ML

[GitHub](https://github.com/Kothamrita)
