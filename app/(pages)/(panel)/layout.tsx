import { ReactNode } from 'react';

export default function layout({ children }: { children: ReactNode }) {
    return (
        <div className='mx-auto max-w-7xl'>
            {children}
        </div>
    );
}