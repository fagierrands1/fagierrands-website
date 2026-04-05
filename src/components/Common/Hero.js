import React from 'react';
import Container from './Container';
import Hero from '../../assets/delivery.png';
import Hero2 from '../../assets/hero2.jpg';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <div className="relative" id="home">
            {/* <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20">
                <div className="blur-[106px] h-56 bg-gradient-to-br from-green-400 to-teal-500 dark:from-green-700"></div>
                <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-blue-500 dark:to-indigo-600"></div>
            </div> */}
            <Container>
                <div className="relative pt-28 ml-auto">
                    <div className="lg:w-2/3 text-center mx-auto">
                        <h1 className="text-gray-900 dark:text-white font-bold text-5xl md:text-6xl xl:text-7xl">
                            Simplify Your Day with <span className="text-primary dark:text-white">Efficient Errands</span>
                        </h1>
                        <p className="mt-6 text-gray-700 dark:text-gray-300">
                            Manage your tasks with ease and reliability—get more done, stress-free.
                        </p>
                        {/* <div className="hidden lg:block  relative w-full">
                            <img src={Hero} className="relative w-full" alt="errands illustration" loading="lazy" width="320" height="280" />
                        </div> */}
                        <div className="mt-10 flex flex-wrap justify-center gap-y-4 gap-x-6">
                            <Link
                                to="/signup"
                                className="relative flex bg-blue-600 rounded-full h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
                            >
                                <span className="relative text-base font-semibold text-white">Get started</span>
                            </Link>
                            {/* <a
                                href="#"
                                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:border before:border-transparent before:bg-primary/10 before:bg-gradient-to-b before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 dark:before:border-gray-700 dark:before:bg-gray-800 sm:w-max"
                            >
                                <span className="relative text-base font-semibold text-primary dark:text-white">Learn more</span>
                            </a> */}
                        </div>

                        <div className="w-full bg-blue-300 p-6 rounded-lg flex items-center flex-col-reverse md:flex-row mt-8 overflow-visible">
                            <div className="md:w-[60%]">
                                <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-4">
                                    Your Personal Assistant for Every Errand
                                </h2>
                                <p className="text-gray-800 dark:text-gray-200 mb-4">
                                    From shopping and deliveries to everyday tasks, our app helps
                                    you get things done faster and with less stress. Whether you're
                                    busy at work or need help managing your time, we’re here to
                                    make your life easier.
                                </p>
                                <Link to="/login" className="mt-6 inline-block bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition">
                                    Start
                                </Link>
                            </div>
                            <div className="">
                                <img src={Hero} className="w-full md:scale-y-150 md:scale-x-110"
                                    alt="errands illustration" loading="lazy" />
                            </div>
                        </div>



                        <div className="hidden py-8 mt-16 border-y border-gray-100 dark:border-gray-800 sm:flex justify-between">
                            <div className="text-left">
                                <h6 className="text-lg font-semibold text-gray-700 dark:text-white">Fast Task Completion</h6>
                                <p className="mt-2 text-gray-500">Get errands done quickly and reliably</p>
                            </div>
                            <div className="text-left">
                                <h6 className="text-lg font-semibold text-gray-700 dark:text-white">Trusted Service</h6>
                                <p className="mt-2 text-gray-500">Reliable help you can depend on</p>
                            </div>
                            <div className="text-left">
                                <h6 className="text-lg font-semibold text-gray-700 dark:text-white">24/7 Support</h6>
                                <p className="mt-2 text-gray-500">We're here whenever you need us</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default HeroSection;
