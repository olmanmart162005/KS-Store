import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MiniCartDrawer } from './MiniCartDrawer';
import { Toast } from '../ui/Toast';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <MiniCartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  );
};
