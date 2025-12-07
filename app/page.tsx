import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Glaucat Platform
        </h1>

        <p
          style={{
            fontSize: "1.4rem",
            color: "#cbd5e1",
            marginBottom: "3rem",
            maxWidth: "600px",
            marginInline: "auto",
            lineHeight: 1.6,
          }}
        >
          Advanced AI-powered vision health monitoring for glaucoma and cataract risk assessment
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/vision-simulator"
            className={styles.button}
            style={{ textDecoration: "none" }}
          >
            Start Vision Test
          </a>

          <a
            href="/risk-assessment"
            className={styles.button}
            style={{
              background: "transparent",
              border: "2px solid #3b82f6",
              textDecoration: "none",
            }}
          >
            Risk Assessment
          </a>
        </div>
      </section>

      {/* Understanding Section */}
      <section
        style={{ padding: "0 2rem", maxWidth: "1200px", margin: "0 auto 4rem" }}
      >
        <div className={styles.card} style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              color: "#3b82f6",
              fontSize: "2rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Understanding Glaucoma & Cataract
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                background: "rgba(59, 130, 246, 0.1)",
                borderRadius: "12px",
              }}
            >
              <h3 style={{ color: "#3b82f6", marginBottom: "1rem" }}>
                Glaucoma
              </h3>
              <p style={{ color: "#e2e8f0", lineHeight: 1.6 }}>
                A group of eye conditions that damage the optic nerve, typically
                due to elevated intraocular pressure. It's often called the
                "silent thief of sight" because symptoms may not appear until
                significant vision loss has occurred.
              </p>
            </div>

            <div
              style={{
                padding: "1.5rem",
                background: "rgba(6, 182, 212, 0.1)",
                borderRadius: "12px",
              }}
            >
              <h3 style={{ color: "#06b6d4", marginBottom: "1rem" }}>
                Cataract
              </h3>
              <p style={{ color: "#e2e8f0", lineHeight: 1.6 }}>
                Clouding of the eye's natural lens that affects vision clarity.
                Cataracts develop slowly and can cause blurry vision, glare
                sensitivity, and difficulty seeing at night.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Factors & Prevention */}
      <section
        style={{ padding: "0 2rem", maxWidth: "1200px", margin: "0 auto 4rem" }}
      >
        <div className={styles.card}>
          <h2
            style={{
              color: "#3b82f6",
              fontSize: "2rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Risk Factors & Prevention
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
            }}
          >
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "1rem" }}>
                Key Risk Factors
              </h3>
              <ul
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.8,
                  paddingLeft: "1.2rem",
                }}
              >
                <li>Age over 60</li>
                <li>Family history of eye diseases</li>
                <li>Diabetes or high blood pressure</li>
                <li>Prolonged corticosteroid use</li>
                <li>Previous eye injury or surgery</li>
                <li>High myopia</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: "#06b6d4", marginBottom: "1rem" }}>
                Prevention & Early Detection
              </h3>
              <ul
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.8,
                  paddingLeft: "1.2rem",
                }}
              >
                <li>Regular comprehensive eye exams</li>
                <li>Annual screening after age 40</li>
                <li>UV protection and healthy lifestyle</li>
                <li>Monitor blood pressure & diabetes</li>
                <li>Know your family's eye history</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: "#8b5cf6", marginBottom: "1rem" }}>
                Why Early Detection Matters
              </h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                Both glaucoma and cataracts can progress silently without
                noticeable symptoms until significant vision loss occurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{ padding: "0 2rem", maxWidth: "1200px", margin: "0 auto 4rem" }}
      >
        <div className={styles.card}>
          <h2
            style={{
              color: "#3b82f6",
              fontSize: "2rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            How Glaucat Works
          </h2>

          <div className={styles.stepper}>
            <span>1. Vision Simulator</span>
            <span>2. Risk Assessment</span>
            <span>3. Results & Recommendations</span>
            <span>4. Professional Consultation</span>
          </div>

          {/* The step boxes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
              marginTop: "2rem",
            }}
          >
            {/* Step 1 */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                1
              </div>
              <h4 style={{ color: "#3b82f6", marginBottom: "0.5rem" }}>
                Interactive Testing
              </h4>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                Experience realistic vision simulation tests designed to detect
                early signs of glaucoma and cataract risk.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                2
              </div>
              <h4 style={{ color: "#06b6d4", marginBottom: "0.5rem" }}>
                AI Assessment
              </h4>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                Answer personalized questions to get an AI-powered risk
                assessment.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                3
              </div>
              <h4 style={{ color: "#8b5cf6", marginBottom: "0.5rem" }}>
                Detailed Results
              </h4>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                Get comprehensive results with personalized recommendations.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                4
              </div>
              <h4 style={{ color: "#10b981", marginBottom: "0.5rem" }}>
                Professional Care
              </h4>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                Consult with eye-care professionals for comprehensive evaluation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "0 2rem",
          maxWidth: "1200px",
          margin: "0 auto 4rem",
          textAlign: "center",
        }}
      >
        <div className={styles.card}>
          <h2
            style={{
              color: "#3b82f6",
              fontSize: "2rem",
              marginBottom: "1rem",
            }}
          >
            Take Control of Your Vision Health Today
          </h2>

          <p
            style={{
              color: "#cbd5e1",
              marginBottom: "2rem",
              fontSize: "1.1rem",
            }}
          >
            Early detection saves sight. Start your journey towards better eye
            health with our advanced assessment tools.
          </p>

          {/* ⭐ Button spacing fix */}
          <div className={styles.buttonRow}>
            <a
              href="/vision-simulator"
              className={styles.button}
              style={{ textDecoration: "none" }}
            >
              Begin Vision Test
            </a>

            <a
              href="/dashboard"
              className={styles.button}
              style={{
                background: "transparent",
                border: "2px solid #3b82f6",
                textDecoration: "none",
              }}
            >
              View Dashboard
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
