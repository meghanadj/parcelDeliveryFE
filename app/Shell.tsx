'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SideNav.module.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div id="mySidenav" className={`${styles.sidenav} ${isOpen ? styles.sidenavOpen : ''}`}>
        <button className={styles.closebtn} onClick={() => setIsOpen(false)}>&times;</button>
        <div className={styles.title}>Parcel Manegement System</div>
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

      {!isOpen && (
        <button
          className={styles.hamburger}
          onClick={() => setIsOpen(true)}
        >
          &#9776;
        </button>
      )}

      <main 
        className="content" 
        style={{ 
          marginLeft: isOpen ? "250px" : "0", 
          padding: "20px", 
          width: "100%",
          transition: "margin-left .3s" 
        }}
      >
        {children}
      </main>
    </>
  );
}
