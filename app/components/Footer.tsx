import styles from './style.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© 2025 GlauCat - Advanced Glaucoma & Cataract Detection Tool. All rights reserved.</p>
      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
        For educational purposes only. Consult a qualified ophthalmologist for medical advice.
      </p>
    </footer>
  );
}
