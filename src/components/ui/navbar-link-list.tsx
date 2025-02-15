import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { WalletButton } from "../solana/solana-provider";
import { ClusterUiSelect } from "../cluster/cluster-ui";
import { SetStateAction } from "jotai";

const NavbarLinkList = ({
  links,
  showMenu,
  setShowMenu,
}: {
  links: { label: string; path: string }[];
  showMenu: boolean;
  setShowMenu: React.Dispatch<SetStateAction<boolean>>;
}) => {
  const pathname = usePathname();
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 724) {
        setShowMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <ul
      className={`${
        showMenu
          ? "absolute w-screen h-[calc(100vh-130px)] md:w-[unset] md:h-[unset] bg-base-100 top-[70px] z-40 flex-col gap-4 w-full flex justify-center items-center"
          : "hidden md:flex px-1 space-x-2 w-full items-center"
      } gap-4 md:gap-16`}
    >
      {links.map(({ label, path }) => (
        <li key={path} onClick={() => setShowMenu(false)} className="">
          <Link
            className={`  ${pathname.startsWith(path)} ? "active" : ""`}
            href={path}
          >
            {label}
          </Link>
        </li>
      ))}
      <li className={`${showMenu ? " " : "ml-auto flex-1"}`}></li>
      <li>
        <ul className="flex flex-col items-center md:flex-row gap-2">
          <li className="" onClick={(e) => e.stopPropagation()}>
            <WalletButton />
          </li>
          <li
            className=""
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ClusterUiSelect setShowMenu={setShowMenu} />
          </li>
        </ul>
      </li>
    </ul>
  );
};

export default NavbarLinkList;
