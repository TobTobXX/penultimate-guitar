import SaveDialog from "@/components/dialog/savedialog";
import TabSheet from "@/components/tab/tabsheet";
import ToolbarButton, {
  getToolbarButtonStyle,
} from "@/components/tab/toolbarbutton";
import { GuitaleleStyle } from "@/constants";
import { useGlobal } from "@/contexts/Global/context";
import { convertToTabLink } from "@/lib/conversion";
import prisma from "@/lib/prisma";
import { getTab } from "@/lib/ug-interface/ug-interface";
import {
  AltVersion,
  NewTab,
  Song,
  TabDto,
  TabLinkDto,
  TabType,
} from "@/models/models";
import { Menu, Transition } from "@headlessui/react";
import _ from "lodash";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useEffect, useRef, useState } from "react";
import "react-tooltip/dist/react-tooltip.css";

const scrollMs = 100;

type TabProps = {
  tabDetails: TabDto;
};

export default function Tab({ tabDetails }: TabProps) {
  const router = useRouter();
  const { mode, setMode } = useGlobal();
  const { id } = router.query;
  const [fontSize, setFontSize] = useState(12);
  const [tranposition, setTranposition] = useState(
    mode === "guitalele" ? -5 : 0
  );
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const scrollinterval = useRef<NodeJS.Timer>();
  const [saveDialogActive, setSaveDialogActive] = useState(false);

  const plainTab = tabDetails.tab;
  const tabLink = convertToTabLink(tabDetails);
  useEffect(() => {
    const recents: any = JSON.parse(localStorage?.getItem("recents") || "{}");
    if (Array.isArray(recents)) {
      recents.unshift({
        taburl: tabDetails.taburl,
        name: tabDetails.song.name,
        artist: tabDetails.song.artist,
        version: tabDetails.version,
        type: tabDetails.type,
      });
      const uniqRecents = _.uniqBy(recents, (r: TabLinkDto) => r.taburl);
      localStorage.setItem("recents", JSON.stringify(uniqRecents));
    } else {
      let arrayRecents = Object.keys(recents).map((r) => ({
        taburl: r,
        name: recents[r].name,
        artist: recents[r].artist,
        version: recents[r].version,
        type: recents[r].type,
      }));

      arrayRecents.unshift({
        taburl: tabDetails.taburl,
        name: tabDetails.song.name,
        artist: tabDetails.song.artist,
        version: tabDetails.version,
        type: tabDetails.type,
      });

      const uniqRecents = _.uniqBy(arrayRecents, (r: TabLinkDto) => r.taburl);

      localStorage.setItem("recents", JSON.stringify(uniqRecents));
    }
  }, [id, tabDetails]);

  const changeScrolling = (type: string) => {
    clearInterval(scrollinterval.current);
    if (type === "up") {
      setScrollSpeed(scrollSpeed + 1);
    } else {
      if (scrollSpeed > 0) {
        setScrollSpeed(scrollSpeed - 1);
      }
    }
  };

  useEffect(() => {
    if (scrollSpeed > 0) {
      scrollinterval.current = setInterval(
        () =>
          window.scrollBy({
            top: scrollSpeed,
            left: 0,
            behavior: "smooth",
          }),
        scrollMs
      );
    }
    return () => {
      clearInterval(scrollinterval.current);
    };
  }, [scrollSpeed]);

  useEffect(() => {
    if (tranposition !== -5) setMode("default");
  }, [tranposition, setMode]);

  useEffect(() => {
    if (mode === "guitalele") setTranposition(-5);
  }, [mode, setTranposition]);

  const handleSave = () => {
    setSaveDialogActive(true);
  };

  const formattedTransposition = () => {
    return tranposition === 0
      ? ""
      : tranposition < 0
      ? tranposition.toString()
      : `+${tranposition}`;
  };

  const toggleMode = () => {
    setMode((old) => {
      if (old === "guitalele") {
        setTranposition(0);
        return "default";
      } else {
        return "guitalele";
      }
    });
  };

  let options = (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className={getToolbarButtonStyle(false)}>▼</Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1 ">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => toggleMode()}
                  className={`${
                    active ? "bg-blue-700 text-white" : "text-gray-900"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  {mode === "default" ? (
                    <span>
                      Enable{" "}
                      <span className={GuitaleleStyle}>Guitalele Mode</span>
                    </span>
                  ) : (
                    <span>
                      Disable{" "}
                      <span className={GuitaleleStyle}>Guitalele Mode</span>
                    </span>
                  )}
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => print()}
                  className={`${
                    active ? "bg-blue-700 text-white" : "text-gray-900"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  Print
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <div>
      <Head>
        <title>
          {tabDetails.song.name
            ? `${tabDetails.song.name} ${
                tabDetails.song.artist && "- " + tabDetails.song.artist
              }`
            : "Penultimate Guitar"}
        </title>
      </Head>
      <>
        <h1 className="text-center text-2xl my-4">
          <span className="font-medium">{tabDetails.song.name}</span>
          <span className="font-light">{` ${
            tabDetails.song.artist && "- " + tabDetails.song.artist
          }`}</span>
        </h1>
        <div className="max-w-lg mx-auto my-4">
          {(tabDetails?.song?.Tab?.length ?? 1) > 1 && (
            <details className="no-print">
              <summary>
                Version {tabDetails?.version} of {tabDetails.song.Tab?.length}
              </summary>

              <ul>
                {tabDetails.song.Tab?.sort((a, b) => a.version - b.version).map(
                  (t, index) => (
                    <li key={index}>
                      {t.taburl === tabDetails.taburl || (
                        <div className="flex gap-8">
                          <Link href={t.taburl} prefetch={false}>
                            {tabDetails.song.name} Version {t.version}{" "}
                          </Link>
                          Rating: {Math.round(t.rating * 100) / 100} / 5.00
                        </div>
                      )}
                    </li>
                  )
                )}
              </ul>
            </details>
          )}
          {!!tabDetails?.capo && <div>Capo: Fret {tabDetails?.capo}</div>}
          {!!tabDetails?.tuning?.value && (
            <div>
              Tuning:{" "}
              <span className="font-bold">{tabDetails?.tuning.name}</span>,{" "}
              {tabDetails?.tuning.value}
            </div>
          )}
        </div>
        <hr className="my-4 no-print" />

        {tabDetails?.tab && (
          <div className="bg-white/50 w-full sticky top-0 top-toolbar no-print z-40">
            <div className="flex justify-between max-w-lg mx-auto my-4 gap-2 text-sm flex-wrap relative">
              <div className="flex-1 flex-col text-center">
                <p className="text-xs whitespace-nowrap">Font size</p>
                <div className="flex gap-1 m-auto w-fit">
                  <ToolbarButton
                    onClick={() => setFontSize(fontSize - 2)}
                    disabled={fontSize < 8}
                  >
                    <span className="text-xs">A</span>
                  </ToolbarButton>
                  <ToolbarButton onClick={() => setFontSize(fontSize + 2)}>
                    <span className="text-2xl">A</span>
                  </ToolbarButton>
                </div>
              </div>

              <div className="flex-1 flex-col text-center">
                <p className="text-xs whitespace-nowrap">
                  {mode !== "guitalele" ? (
                    "Transpose"
                  ) : (
                    <span className={GuitaleleStyle}>Guitalele Mode!</span>
                  )}
                  {mode === "guitalele" ||
                    tranposition === 0 ||
                    ` (${formattedTransposition()})`}
                </p>
                <div className="flex gap-1 m-auto w-fit">
                  <ToolbarButton
                    onClick={() => setTranposition(tranposition - 1)}
                  >
                    ➖
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => setTranposition(tranposition + 1)}
                  >
                    ➕
                  </ToolbarButton>
                </div>
              </div>

              <div className="flex-1 flex-col text-center">
                <p className="text-xs whitespace-nowrap">
                  Autoscroll {scrollSpeed > 0 && ` (${scrollSpeed})`}
                </p>
                <div className="flex gap-1 m-auto w-fit">
                  <ToolbarButton
                    onClick={() => changeScrolling("down")}
                    disabled={scrollSpeed < 1}
                  >
                    ➖
                  </ToolbarButton>
                  <ToolbarButton onClick={() => changeScrolling("up")}>
                    ➕
                  </ToolbarButton>
                </div>
              </div>
              <div className="flex-1 flex-col text-center">
                <p className="text-xs whitespace-nowrap">Options</p>
                <div className="flex gap-1 m-auto w-fit">
                  <ToolbarButton onClick={handleSave}>💾</ToolbarButton>
                  {options}
                </div>
              </div>
            </div>
          </div>
        )}

        <TabSheet
          plainTab={plainTab}
          fontSize={fontSize}
          transposition={tranposition}
        ></TabSheet>

        <hr className="my-4 no-print" />
        <div className="max-w-lg mx-auto my-4 no-print flex">
          <div>
            {!!tabDetails?.contributors?.length && (
              <details>
                <summary>
                  {tabDetails?.contributors?.length} Contributors
                </summary>
                <ul>
                  {tabDetails?.contributors?.map((c, index) => (
                    <li key={index}>
                      <Link href={`https://www.ultimate-guitar.com/u/${c}`}>
                        {c}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
        <SaveDialog
          isOpen={saveDialogActive}
          setIsOpen={setSaveDialogActive}
          tab={tabLink}
        />
      </>
    </div>
  );
}

/**
 * ============= SERVER SIDE =============
 */

const defaultProps: TabDto = {
  taburl: "",
  song: { id: 0, name: "", artist: "" },
  contributors: [],
  capo: 0,
  tab: "",
  version: 0,
  songId: 0,
  rating: 0,
  type: "Tab",
};

export async function getStaticPaths() {
  const savedTabs = await prisma.tab.findMany({
    where: {
      tab: {
        not: "ALT",
      },
    },
    select: {
      taburl: true,
    },
  });

  const paths = savedTabs.map((tab) => ({
    params: { id: tab.taburl.split("/") },
  }));

  return { paths, fallback: "blocking" };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  let props: TabDto = {
    ...defaultProps,
  };

  if (typeof params.id === "object") {
    const url = params.id.join("/");

    const savedTab = await prisma.tab.findUnique({
      where: {
        taburl: url,
      },
      include: {
        song: {
          include: {
            Tab: {
              select: {
                taburl: true,
                version: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (savedTab?.tab && savedTab?.tab !== "ALT") {
      props = {
        ...savedTab,
        type: savedTab.type as TabType,
        tuning: JSON.parse(savedTab.tuning ?? "{}"),
      };
    } else {
      const fullurl = `https://tabs.ultimate-guitar.com/tab/${url}`;
      const [song, tab, altVersions] = await getTab(fullurl);
      if (tab.songId === undefined) {
        return {
          notFound: true,
        };
      }
      tab.taburl = url;
      props = {
        ...tab,
        song: { ...song, Tab: [...altVersions, tab] },
      };
      insertTab(song, tab, altVersions);
    }
  }
  if (!props.song.name) {
    return {
      notFound: true,
    };
  }

  return { props: { tabDetails: props } };
};

async function insertTab(song: Song, tab: NewTab, altVersions: AltVersion[]) {
  try {
    // upsert song
    if (!!song.id) {
      // left as await since later tab insertion needs songId
      await prisma.song.upsert({
        where: {
          id: song.id,
        },
        create: {
          id: song.id,
          name: song.name,
          artist: song.artist,
        },
        update: {},
      });
    }

    // insert tab
    if (!!tab.tab) {
      prisma.tab
        .upsert({
          where: {
            taburl: tab.taburl,
          },
          create: {
            ...tab,
            tuning: JSON.stringify(tab?.tuning ?? {}),
            capo: tab.capo ?? 0,
          },
          update: {
            tab: tab.tab,
            contributors: tab.contributors,
            tuning: JSON.stringify(tab?.tuning ?? {}),
            capo: tab.capo ?? 0,
          },
        })
        .then();

      for (let altVersion of altVersions) {
        prisma.tab
          .upsert({
            where: {
              taburl: altVersion.taburl,
            },
            create: {
              ...defaultProps,
              ...altVersion,
              songId: tab.songId,
              tuning: "{}",
              taburl: altVersion.taburl,
              tab: "ALT",
              capo: 0,
              song: undefined,
            },
            update: {},
          })
          .then();
      }
    }
  } catch (err) {
    console.warn("Insertion failed.", err);
  }
}
