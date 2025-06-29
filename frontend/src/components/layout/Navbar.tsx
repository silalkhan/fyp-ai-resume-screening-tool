import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import DarkModeToggle from "../ui/DarkModeToggle";

interface NavbarProps {
  servicesStatus?: {
    backend: boolean;
    nlp: boolean;
  };
}

const navigation = [{ name: "Home", href: "/" }];

// Admin links - only shown in dropdown
const adminNavigation = [{ name: "Admin Dashboard", href: "/admin" }];

const Navbar: React.FC<NavbarProps> = ({ servicesStatus }) => {
  return (
    <Disclosure
      as="nav"
      className="bg-white shadow-soft dark:bg-gray-800 dark:text-white transition-colors"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link
                    to="/"
                    className="text-xl font-bold text-primary-600 dark:text-primary-400"
                  >
                    AI Resume Screening Tool
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-primary-500 hover:text-gray-700 transition-colors dark:text-gray-300 dark:hover:text-white"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                {/* Service status indicators */}
                {servicesStatus && (
                  <div className="flex items-center space-x-3 mr-2 border-r pr-4">
                    <div className="flex items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full mr-1.5 ${
                          servicesStatus.backend ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Backend:
                      </span>
                      <span
                        className={`text-xs font-medium ml-1 ${
                          servicesStatus.backend
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        {servicesStatus.backend ? "online" : "offline"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full mr-1.5 ${
                          servicesStatus.nlp ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        NLP Service:
                      </span>
                      <span
                        className={`text-xs font-medium ml-1 ${
                          servicesStatus.nlp
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        {servicesStatus.nlp ? "online" : "offline"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dark Mode Toggle */}
                <DarkModeToggle />

                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex items-center rounded-full bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                      <span className="mr-2 text-gray-700 dark:text-gray-300">
                        Admin
                      </span>
                      <UserCircleIcon
                        className="h-8 w-8 text-gray-400 dark:text-gray-300"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {adminNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              to={item.href}
                              className={clsx(
                                active ? "bg-gray-100 dark:bg-gray-600" : "",
                                "block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                              )}
                            >
                              {item.name}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>

              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile Dark Mode Toggle */}
                <DarkModeToggle />

                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="space-y-1 pb-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Admin Menu
                </p>
              </div>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile service status indicators */}
            {servicesStatus && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 pb-3">
                <div className="flex items-center justify-center space-x-4 px-4">
                  <div className="flex items-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full mr-1.5 ${
                        servicesStatus.backend ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Backend:
                    </span>
                    <span
                      className={`text-xs font-medium ml-1 ${
                        servicesStatus.backend
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {servicesStatus.backend ? "online" : "offline"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full mr-1.5 ${
                        servicesStatus.nlp ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      NLP Service:
                    </span>
                    <span
                      className={`text-xs font-medium ml-1 ${
                        servicesStatus.nlp
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {servicesStatus.nlp ? "online" : "offline"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
