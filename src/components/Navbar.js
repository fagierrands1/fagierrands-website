import React from 'react';
import { useState, useEffect } from "react";
import Container from "./common/Container";
import { Link } from 'react-router-dom';
import Logo from '../assets/logo.png'
import { FaBars, FaBell, FaSignOutAlt, } from 'react-icons/fa';

const links = [
    {
        to: "/dashboard",
        label: "Dashboard",
    },
    {
        to: "/my-orders",
        label: "Orders",
    },
    {
        to: "/notifications",
        label: "Notifications",
    },
];

export default function Navbar() {
    const [isToggled, setIsToggled] = useState(false);

    useEffect(() => {
        const navlinks = document.querySelector("#navlinks");
        const layer = document.querySelector("#navLayer");
        const hamburger = document.querySelector("#hamburger");

        function toggleNavlinks() {
            if (isToggled) {
                navlinks.classList.add("!visible", "!scale-100", "!opacity-100", "!lg:translate-y-0");
                hamburger.classList.add("toggled");
                layer.classList.add("origin-top", "scale-y-80");
            } else {
                navlinks.classList.remove("!visible", "!scale-100", "!opacity-100", "!lg:translate-y-0");
                hamburger.classList.remove("toggled");
                layer.classList.remove("origin-top", "scale-y-100");
            }
        }

        toggleNavlinks();

        return () => {
            const linksList = [...navlinks.querySelectorAll("ul > li > a")];
            linksList.forEach((link) => {
                link.removeEventListener("click", toggleNavlinks);
            });
        };
    }, [isToggled]);

    const handleHamburgerClick = () => {
        setIsToggled(!isToggled);
    };

    return (
        <header className="">
            <nav className="z-10 w-full border-b border-black/5 dark:border-white/5 
            lg:border-transparent">
                <Container>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 md:gap-0 md:py-4">
                        <div className="relative z-20 flex w-full justify-between md:px-0 lg:w-max">
                            <a href="/#home" aria-label="logo" className="flex items-center space-x-2">
                                <div aria-hidden="true" className="flex space-x-1">
                                    <div className="h-16 w-16 rounded-full flex items-center justify-center  dark:bg-white">
                                        <img src={Logo} className="" alt="Fagi Errands logo" width="144"
                                            height="133" />
                                    </div>
                                    <div className="h-6 w-2 bg-primary"></div>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Fagi Errands
                                </span>
                            </a>

                            <div className="relative flex max-h-10 items-center lg:hidden">
                                <button aria-label="hamburger" id="hamburger" className="relative -mr-6 p-6" onClick={handleHamburgerClick}>
                                    <div aria-hidden="true" id="line" className="m-auto h-0.5 w-5 rounded bg-sky-900 transition duration-300 dark:bg-gray-300"></div>
                                    <div aria-hidden="true" id="line2" className="m-auto mt-2 h-0.5 w-5 rounded bg-sky-900 transition duration-300 dark:bg-gray-300"></div>
                                </button>
                            </div>
                        </div>
                        <div id="navLayer" aria-hidden="true" className="fixed inset-0 z-10 h-screen w-screen origin-bottom scale-y-0 bg-white/70 backdrop-blur-2xl transition duration-500 dark:bg-gray-900/70 lg:hidden"></div>
                        <div id="navlinks" className="invisible py-2 absolute top-full left-0 z-20 w-full origin-top-right translate-y-1 scale-90 flex-col flex-wrap justify-end 
                            gap-6 rounded-3xl border border-gray-100 bg-white p-8 opacity-0 shadow-2xl shadow-gray-600/10 
                            transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none 
                            lg:visible lg:relative lg:flex lg:w-7/12 lg:translate-y-0 lg:scale-100 lg:flex-row 
                            lg:items-center lg:gap-0 lg:border-none lg:bg-transparent lg:p-0 lg:opacity-100 
                            lg:shadow-none">

                            <div className="w-full text-gray-600 dark:text-gray-200 lg:w-auto lg:pr-4 lg:pt-0">
                                <ul className="flex flex-col gap-6 tracking-wide lg:flex-row lg:gap-0 lg:text-sm">
                                    {links.map((link, index) => (
                                        <li key={index} className="">
                                            <Link to={link.to} className="hover:text-primary block transition dark:hover:text-white md:px-4">
                                                <span>{link.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                    {/* <li>
                                        <Link to="/login" className="flex gap-2 font-semibold text-gray-700 transition hover:text-primary dark:text-white dark:hover:text-white md:px-4">
                                            <p>Sign In</p>
                                        </Link>
                                    </li> */}
                                </ul>
                            </div>
                            <div className="mt-12 lg:mt-0">
                                <button className="relative rounded-full bg-blue-500  flex h-9 w-full items-center justify-center px-4 
                                before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max">
                                    <FaSignOutAlt className="inline-block mr-1" />
                                    <span className="relative  text-sm font-semibold text-white">
                                        Sign Out
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Container>
            </nav>
        </header>
    );
}

