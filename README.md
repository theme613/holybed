
# 🏥 Holy.Bed: The AI Solution for Hospital Chaos

![Project Status: Hackathon Submission](https://img.shields.io/badge/Status-Hackathon%20Project-blue)
![Built with Next.js](https://img.shields.io/badge/Framework-Next.js-black)
![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)

---

## 💡 The Problem

Hospitals worldwide are plagued by inefficiency, leading to critical delays in patient care, overcrowded emergency rooms, and immense economic strain resulting in staff burnout. Specifically, we face:
* **Inefficient Emergency Triage:** Patients often wait hours in general ERs, even for non-emergency issues, blocking resources for critical cases.
* **Systemic Overcrowding:** A lack of real-time visibility into bed capacity and doctor availability causes long ambulance and hospital bed waiting times.
* **Misallocation of Resources:** Data silos prevent healthcare authorities from efficiently allocating specialist manpower based on regional disease trends.

---

## 🚀 The Solution

**Holy.Bed** is an AI-powered system designed to be the central hub for patient guidance and resource optimization, ensuring every patient reaches the right specialist at the right time.

### Key Features

| Feature | Description | AI/Data Component |
| :--- | :--- | :--- |
| **GenAI Symptom Triage** | Patients describe their symptoms in natural, plain language, and the AI instantly classifies their case as **Urgent, Mild, or Emergency**. | Large Language Models (LLMs) for natural language understanding and classification. |
| **Smart Hospital Recommendation** | Provides a real-time list of nearby hospitals or clinics, prioritized by current **bed capacity** and **doctor availability**. | Geospatial data processing and real-time hospital resource API simulation/integration. |
| **Specialist Matching** | Directs patients past overcrowded general queues straight to the appropriate specialist department (e.g., Cardiology, Orthopedics). | Rule-based and machine learning matching algorithms based on triage result. |
| **Preventive Care Assistant** | Allows users to upload medical reports for automated analysis, providing personalized health insights and **preventive measures**. | Optical Character Recognition (OCR) and document analysis models. |
| **Manpower Optimization Dashboard** | Provides authorities with data-driven insights into dominant diseases and patient flow, enabling intelligent allocation of doctors and specialists. | Data aggregation, visualization, and time-series analysis. |

---

## 🛠️ Tech Stack

Holy.Bed is a modern, responsive web application built on a cutting-edge stack:

* **Framework:** [Next.js](https://nextjs.org) (React)
* **Language:** JavaScript
* **Styling:** CSS
* **Mapping/Location:** Google Maps API (for routing and hospital location services)
* **AI/ML:** Integrated GenAI models (simulated/external API) for Triage and Report Analysis.
* **Deployment:** [Vercel](https://vercel.com/)

---

## 🛣️ Future Development

Our vision for Holy.Bed extends beyond the hackathon:

1.  **Omni-Input Triage:** Implement symptom input via **voice command** and **handwritten report upload** for greater accessibility.
2.  **Real-Time Ambulance Navigation:** Integrate live traffic data and hospital status for a system that directs ambulances to the nearest *available* hospital, not just the nearest one.
3.  **Digital Healthcare Mandate:** Work with government bodies to promote a transition from paper-based to app-based health records, creating a real-time, privacy-compliant national health database.

---

## ⚙️ Getting Started

Follow these steps to set up and run a local copy of the project.

### Prerequisites

You will need the following installed:

* **Node.js** (v18+)
* **npm**, **yarn**, or **pnpm**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/theme613/holybed.git](https://github.com/theme613/holybed.git)
    cd holybed
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Setup Google Maps API:**
    * Create a **`.env.local`** file in the root directory.
    * Add your Google Maps API Key as specified in the `Maps_SETUP.md` file (check the repository for details).
    * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE`

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The application will hot-reload as you make changes.

EOF
