'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithGoogle, signOut } from "../_lib/firebase/auth";
import { firebaseConfig } from "../_lib/firebase/config";

function useUserSession(initialUser) {
  // The initialUser comes from the server via a server component
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  // Register the service worker that sends auth state back to server
  // The service worker is built with npm run build-service-worker
  // useEffect(() => {
  //   if ("serviceWorker" in navigator) {
  //     const serializedFirebaseConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
  //     const serviceWorkerUrl = `/auth-service-worker.js?firebaseConfig=${serializedFirebaseConfig}`

  //     navigator.serviceWorker
  //       .register(serviceWorkerUrl)
  //       .then((registration) => console.log("scope is: ", registration.scope));
  //   }
  // }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser)
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onAuthStateChanged((authUser) => {
      if (user === undefined) return

      // refresh when user changed to ease testing
      if (user?.email !== authUser?.email) {
        router.refresh()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return user;
}

export default function Header({ initialUser }) {

  const user = useUserSession(initialUser);

  const handleSignOut = event => {
    event.preventDefault();
    signOut();
  };

  const handleSignIn = event => {
    event.preventDefault();
    signInWithGoogle();
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-menu')) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      {user ? (
        <header className="flex items-center justify-between p-4 bg-black">
          <div className="flex space-x-6">
            <Link href="/" className="text-white hover:text-gray-300">
              Home
            </Link>
            <Link href="/jobs" className="text-white hover:text-gray-300">
              Jobs
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <button className="flex items-center px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">
              Upload new CVs
              <span className="ml-2 text-sm">10 tokens</span>
            </button>
            <div className="relative profile-menu">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={toggleMenu}>
                <img
                  className="w-10 h-10 rounded-full"
                  src={user.photoURL || "/profile.svg"}
                  alt={user.email}
                />
                <p className="text-white">{user.displayName}</p>
              </div>
              {isMenuOpen && (
                <div className="absolute right-0 w-48 p-2 mt-2 text-black bg-white rounded-lg shadow-lg">
                  <ul>
                    <li className="px-4 py-2 hover:bg-gray-100">
                      <Link href="#">Support Request</Link>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100">
                      <Link href="#">Billing</Link>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100">
                      <a href="#" onClick={handleSignOut}>Sign Out</a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>
      ) : (
        <div className="profile"><a href="#" onClick={handleSignIn}>
          <button
            className="px-4 py-2 text-black bg-white rounded-full"
          >
            Google Sign In
          </button>
        </a></div>
      )}
    </>
  );
}