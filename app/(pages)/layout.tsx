import Header from '@/components/ui/Header';
import { ReactNode } from 'react';

export default function layout({ children }: { children: ReactNode }) {
    return (
        <div className='h-full'>
            <Header />
            {children}
        </div>
    );
}