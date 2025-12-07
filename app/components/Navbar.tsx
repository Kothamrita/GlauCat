import styles from './style.module.css';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>GlauCat</div>
      <div>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/risk-assessment">Risk Assessment</Link>
        <Link href="/vision-simulator">Vision Simulator</Link>
      </div>
    </nav>
  );
}
