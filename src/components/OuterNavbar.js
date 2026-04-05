import React, { useState } from 'react'
import Logo from '../assets/logo.jpg'
import { FaBars, FaBell, FaSignOutAlt, } from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

function OuterNavbar() {
    const [menu, setMenu] = useState(false)
    const toggleMenu = () => {
        setMenu(!menu)
    }
    return (
        <header className="text-base font-semibold ">
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <Link to='/' className="text-3xl font-bold text-gray-900">
                    <img
                        src={Logo}
                        className="md:w-24 w-20"
                        alt=" Logo"
                    />
                </Link>
                <nav className='md:block hidden '>
                    <a href="/signup" className=" px-3 py-3 rounded-md text-sm font-medium">Sign Up</a>
                    <a href="/login" className="  px-3 py-3 rounded-md text-sm font-medium">Login</a>
                    <a href="tel:+254748370829" className="bg-blue-500 text-white px-3 py-3 rounded-md text-sm 
                    font-medium hover:bg-blue-700">Contact Us</a>
                </nav>

                <div className='md:hidden ' onClick={toggleMenu}>
                    <FaBars />
                </div>
                {menu ?
                    <nav className="absolute bg-gray-300 rounded-lg z-30 top-1 mx-auto w-[92%]">
                        <div className='flex justify-between px-6 py-3 '>
                            <div className='flex flex-col gap-3'>
                                <a href="/signup" className=" px-3 py-2 rounded-md text-sm font-medium">Sign Up</a>
                                <a href="/login" className="  px-3 py-2 rounded-md text-sm font-medium">Login</a>
                                <a href="tel:+254748370829" className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm 
                                font-medium hover:bg-blue-700">Contact Us</a>
                            </div>
                            <FaX className='h-6 bg-blue-500 rounded-full text-white w-6 p-2' onClick={toggleMenu} />
                        </div>
                    </nav>
                    : <div className='hidden'></div>
                }
            </div>
        </header>
    )
}

export default OuterNavbar