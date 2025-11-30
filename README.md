# LangLab: The AP Rhetoric Architect

A collaborative, full-stack educational web application designed for AP English Language classrooms.

## Features

- **Smart Text Reader**: Distraction-free reading with chunking.
- **RAV Engine**: Rhetorically Accurate Verbs database.
- **Social Annotation**: Collaborative highlighting and commenting.
- **Thesis Builder**: Drag-and-drop interface for constructing thesis statements.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Vanilla CSS (CSS Modules/Variables) - "Academic Zen" theme
- **Backend**: Firebase (Auth, Firestore, Functions) - *Configuration required*

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## Firebase Setup

Update `src/lib/firebase.ts` with your Firebase project configuration.
