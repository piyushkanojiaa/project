import React, { ReactNode } from 'react';
import MainNav from '../navigation/MainNav';
import Footer from '../common/Footer';

interface PageLayoutProps {
    children: ReactNode;
    showFooter?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, showFooter = true }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <MainNav />
            <main className="flex-1 pt-16">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

export default PageLayout;
