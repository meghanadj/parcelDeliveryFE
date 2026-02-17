'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SideNav.module.css';

export default function SideNav() {
  const pathname = usePathname();

  return (
    <div className={styles.sidenav}>
      <div className={styles.title}>Parcel Manegement System Management System</div>
      <div className={styles.navParams}>
        <Link
          href="/orders"
          className={`${styles.link} ${pathname === '/orders' ? styles.active : ''}`}
        >
          Orders
        </Link>
        <Link
          href="/departments"
          className={`${styles.link} ${pathname === '/departments' ? styles.active : ''}`}
        >
          Departments
        </Link>
        <Link
          href="/upload-file"
          className={`${styles.link} ${pathname === '/upload-file' ? styles.active : ''}`}
        >
          Upload
        </Link>
      </div>
    </div>
  );
}
