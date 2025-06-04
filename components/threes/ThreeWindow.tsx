'use client'
import Sketch from '@/services/threejs';
import { useEffect } from 'react';



export default function ThreeWindow() {

    useEffect(() => {
       new Sketch({ dom: document.getElementById('three-window') });
    }, [])

    return (
        <div className='w-screen h-screen bg-rose-50' id='three-window' >

        </div>
    );
}



