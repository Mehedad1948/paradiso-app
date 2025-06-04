'use client'
import Sketch from '@/services/threejs';
import { useEffect } from 'react';



export default function ThreeWindow() {

    useEffect(() => {
       new Sketch({ dom: document.getElementById('three-window') });
    }, [])

    return (
        <div className='w-screen h-screen fixed left-0 top-0 z-0 ' id='three-window' >

        </div>
    );
}



