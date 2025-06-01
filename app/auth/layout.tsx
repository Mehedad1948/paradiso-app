import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="grid grid-cols-2   w-full h-full min-h-dvh">
            <div className='p-4  h-full w-full'>
                <div className='rounded-3xl bg-purple-900 h-full w-full'>

                </div>
            </div>
            <div className='px-16 py-8'>
                {children}
            </div>
        </div>
    );
}
