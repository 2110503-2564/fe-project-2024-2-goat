"use client"; 
import styles from './banner.module.css';
import { useState } from 'react';
import Image from 'next/image';

export default function Banner() {
  const covers = ['/img/cover.jpg', '/img/cover2.jpg', '/img/cover3.jpg'];
  const [index, setIndex] = useState(0);

  return (
    <div className={styles.banner} onClick={() => setIndex(index + 1)}>
      <Image 
        src={covers[index % 3]} 
        alt='cover' 
        fill={true} 
        objectFit='cover' 
        className={styles.image}
      />
      <div className={styles.overlay}></div>
      <div className={styles.bannerText}>
        <h1 className={styles.headline}>Unwind. Relax. Rejuvenate.</h1>
        <p className={styles.subText}>Let us take your stress away. Book your massage today.</p>
      </div>
    </div>
  );
}
