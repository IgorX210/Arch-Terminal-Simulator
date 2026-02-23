const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================================
//  VIRTUAL FILESYSTEM (per-session stored in memory)
//  Sessions expire after 30 minutes of inactivity
// ============================================================
const sessions = {};
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

function getSession(id) {
  if (!sessions[id]) {
    sessions[id] = createDefaultSession();
  }
  sessions[id].lastAccess = Date.now();
  return sessions[id];
}

function createDefaultSession() {
  return {
    lastAccess: Date.now(),
    cwd: "/home/user",
    env: {
      USER: "user",
      HOME: "/home/user",
      SHELL: "/bin/bash",
      TERM: "xterm-256color",
      EDITOR: "vim",
      PAGER: "less",
      PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    },
    history: [],
    aliases: {
      ll: "ls -la",
      la: "ls -A",
      l: "ls -CF",
      grep: "grep --color=auto",
      diff: "diff --color=auto",
      ip: "ip --color=auto",
    },
    vfs: JSON.parse(JSON.stringify(DEFAULT_VFS)),
  };
}

// Clean up old sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const id in sessions) {
    if (now - sessions[id].lastAccess > SESSION_TIMEOUT) {
      delete sessions[id];
    }
  }
}, 10 * 60 * 1000);

// ============================================================
//  DEFAULT VIRTUAL FILESYSTEM
// ============================================================
const DEFAULT_VFS = {
  "/": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/bin": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/boot": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/dev": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/etc": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/home": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user": { type: "dir", perms: "drwx------", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/Desktop": { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/Documents": { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/Downloads": { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/Music": { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/Pictures": { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/Videos": { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00" },
  "/home/user/.bashrc": {
    type: "file", perms: "-rw-r--r--", owner: "user", size: 312, mtime: "Jan  1 00:00",
    content: "# ~/.bashrc: executed by bash for non-login shells.\n\n# If not running interactively, don't do anything\n[[ $- != *i* ]] && return\n\n# Aliases\nalias ll='ls -la'\nalias la='ls -A'\nalias grep='grep --color=auto'\nalias pacman='pacman --color=auto'\n\n# Prompt\nPS1='[\\u@\\h \\W]\\$ '\n\n# Environment\nexport EDITOR=vim\nexport PAGER=less\n",
  },
  "/home/user/.bash_profile": {
    type: "file", perms: "-rw-r--r--", owner: "user", size: 120, mtime: "Jan  1 00:00",
    content: "# ~/.bash_profile\n[[ -f ~/.bashrc ]] && . ~/.bashrc\n",
  },
  "/home/user/.bash_history": {
    type: "file", perms: "-rw-------", owner: "user", size: 256, mtime: "Jan  1 00:00",
    content: "neofetch\nls -la\npacman -Syu\ncd Documents\nvim notes.txt\nhtop\nuname -a\ncat /etc/os-release\nsystemctl status\n",
  },
  "/home/user/.vimrc": {
    type: "file", perms: "-rw-r--r--", owner: "user", size: 88, mtime: "Jan  1 00:00",
    content: "\" ~/.vimrc\nset number\nset tabstop=4\nset expandtab\nset autoindent\nsyntax on\ncolorscheme desert\n",
  },
  "/home/user/Documents/notes.txt": {
    type: "file", perms: "-rw-r--r--", owner: "user", size: 64, mtime: "Jan  1 00:00",
    content: "Arch Linux is the best distro.\nBTW I use Arch.\nKeep it simple, stupid.\n",
  },
  "/home/user/Documents/todo.txt": {
    type: "file", perms: "-rw-r--r--", owner: "user", size: 128, mtime: "Jan  1 00:00",
    content: "TODO:\n[ ] Install AUR packages\n[ ] Configure polybar\n[ ] Rice neovim\n[ ] Touch grass\n[x] Install Arch\n",
  },
  "/home/user/Desktop/readme.txt": {
    type: "file", perms: "-rw-r--r--", owner: "user", size: 48, mtime: "Jan  1 00:00",
    content: "Welcome to Arch Linux Terminal Simulator!\nType 'help' to see available commands.\n",
  },
  "/etc/os-release": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 218, mtime: "Jan  1 00:00",
    content: 'NAME="Arch Linux"\nPRETTY_NAME="Arch Linux"\nID=arch\nBUILD_ID=rolling\nANSI_COLOR="38;2;23;147;209"\nLOGO=archlinux-logo\nCPE_NAME="cpe:/o:archlinux:arch_linux"\nHOME_URL=""\nSUPPORT_URL=""\nBUG_REPORT_URL=""\nPRIVACY_POLICY_URL=""\n',
  },
  "/etc/hostname": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 8, mtime: "Jan  1 00:00",
    content: "archbtw\n",
  },
  "/etc/hosts": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 180, mtime: "Jan  1 00:00",
    content: "127.0.0.1   localhost\n::1         localhost\n127.0.1.1   archbtw.localdomain archbtw\n",
  },
  "/etc/locale.conf": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 22, mtime: "Jan  1 00:00",
    content: "LANG=en_US.UTF-8\n",
  },
  "/etc/timezone": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 18, mtime: "Jan  1 00:00",
    content: "America/New_York\n",
  },
  "/etc/pacman.conf": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 1024, mtime: "Jan  1 00:00",
    content: "# /etc/pacman.conf\n[options]\nHoldPkg = pacman glibc\nArchitecture = auto\nColor\nCheckSpace\nVerbosePkgLists\nParallelDownloads = 5\n\n[core]\nInclude = /etc/pacman.d/mirrorlist\n\n[extra]\nInclude = /etc/pacman.d/mirrorlist\n\n[multilib]\nInclude = /etc/pacman.d/mirrorlist\n",
  },
  "/usr": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/usr/bin": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/usr/lib": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/var": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/var/log": { type: "dir", perms: "drwxr-xr-x", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/var/log/pacman.log": {
    type: "file", perms: "-rw-r--r--", owner: "root", size: 512, mtime: "Jan  1 00:00",
    content: "[2024-01-01 00:00] [PACMAN] Running 'pacman -Syu'\n[2024-01-01 00:01] [PACMAN] synchronizing package lists\n[2024-01-01 00:02] [ALPM] upgraded linux (6.7.0-1 -> 6.8.9-1)\n[2024-01-01 00:02] [ALPM] upgraded pacman (6.0.2-7 -> 6.1.0-1)\n",
  },
  "/tmp": { type: "dir", perms: "drwxrwxrwt", owner: "root", size: 4096, mtime: "Jan  1 00:00" },
  "/proc": { type: "dir", perms: "dr-xr-xr-x", owner: "root", size: 0, mtime: "Jan  1 00:00" },
  "/proc/version": {
    type: "file", perms: "-r--r--r--", owner: "root", size: 0, mtime: "Jan  1 00:00",
    content: "Linux version 6.8.9-arch1-1 (linux@archlinux) (gcc (GCC) 14.1.1 20240507, GNU ld (GNU Binutils) 2.42.0) #1 SMP PREEMPT_DYNAMIC Thu, 16 May 2024 22:29:16 +0000\n",
  },
  "/proc/cpuinfo": {
    type: "file", perms: "-r--r--r--", owner: "root", size: 0, mtime: "Jan  1 00:00",
    content: "processor\t: 0\nvendor_id\t: AuthenticAMD\nmodel name\t: AMD Ryzen 9 7950X 16-Core Processor\ncpu MHz\t\t: 5084.697\ncache size\t: 1024 KB\ncpu cores\t: 16\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr\n",
  },
  "/proc/meminfo": {
    type: "file", perms: "-r--r--r--", owner: "root", size: 0, mtime: "Jan  1 00:00",
    content: "MemTotal:       32768000 kB\nMemFree:        24576000 kB\nMemAvailable:   26214400 kB\nBuffers:          512000 kB\nCached:          2048000 kB\nSwapTotal:       8388608 kB\nSwapFree:        8388608 kB\n",
  },
};

// ============================================================
//  SYSTEM CONSTANTS
// ============================================================
const SYSINFO = {
  user: "user",
  hostname: "archbtw",
  os: "Arch Linux x86_64",
  kernel: "6.8.9-arch1-1",
  uptime: "3 hours, 37 mins",
  packages: "1337 (pacman), 142 (flatpak)",
  shell: "bash 5.2.26",
  resolution: "1920x1080",
  de: "KDE Plasma 6.0.4",
  wm: "KWin",
  wmTheme: "Breeze Dark",
  theme: "Breeze Dark [KDE], Breeze [GTK2/3]",
  icons: "Papirus-Dark [KDE], Papirus-Dark [GTK2/3]",
  terminal: "Konsole 24.02.2",
  cpu: "AMD Ryzen 9 7950X (32) @ 5.085GHz",
  gpu: "NVIDIA GeForce RTX 4090",
  memory: "6291MiB / 32768MiB",
};

const ARCH_ASCII = [
  "                   -`                  ",
  "                  .o+`                 ",
  "                 `ooo/                 ",
  "                `+oooo:                ",
  "               `+oooooo:               ",
  "               -+oooooo+:              ",
  "             `/:-:++oooo+:             ",
  "            `/++++/+++++++:            ",
  "           `/++++++++++++++:           ",
  "          `/+++ooooooooooooo/`         ",
  "         ./ooosssso++osssssso+`        ",
  "        .oossssso-````/ossssss+`       ",
  "       -osssssso.      :ssssssso.      ",
  "      :osssssss/        osssso+++.     ",
  "     /ossssssss/        +ssssooo/-     ",
  "   `/ossssso+/:-        -:/+osssso+-   ",
  "  `+sso+:-`                 `.-/+oso:  ",
  " `++:.                           `-/+/ ",
  " .`                                 `/ ",
];

// ============================================================
//  HELPER FUNCTIONS
// ============================================================
function resolvePath(cwd, inputPath) {
  if (!inputPath || inputPath === "") return cwd;
  if (inputPath === "~") return "/home/user";
  if (inputPath.startsWith("~/")) return "/home/user" + inputPath.slice(1);
  if (inputPath.startsWith("/")) {
    return normalizePath(inputPath);
  }
  return normalizePath(cwd + "/" + inputPath);
}

function normalizePath(p) {
  const parts = p.split("/").filter(Boolean);
  const resolved = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return "/" + resolved.join("/");
}

function getNode(vfs, path) {
  return vfs[path] || null;
}

function getChildren(vfs, path) {
  const prefix = path === "/" ? "/" : path + "/";
  return Object.keys(vfs).filter((k) => {
    if (k === path) return false;
    if (!k.startsWith(prefix)) return false;
    const rest = k.slice(prefix.length);
    return !rest.includes("/");
  });
}

function basename(p) {
  return p.split("/").filter(Boolean).pop() || "/";
}

function dirname(p) {
  const parts = p.split("/").filter(Boolean);
  parts.pop();
  return "/" + parts.join("/");
}

function formatSize(size) {
  return String(size).padStart(8);
}

function randomUptime() {
  const h = Math.floor(Math.random() * 10) + 1;
  const m = Math.floor(Math.random() * 60);
  return `${h} hours, ${m} mins`;
}

function randomMemUsed() {
  const used = Math.floor(Math.random() * 8192) + 2048;
  return `${used}MiB / 32768MiB`;
}

// ============================================================
//  COMMAND PROCESSOR
// ============================================================
function processCommand(session, rawInput) {
  const input = rawInput.trim();
  if (!input) return { output: "", cwd: session.cwd };

  // Add to history
  if (session.history[session.history.length - 1] !== input) {
    session.history.push(input);
    if (session.history.length > 500) session.history.shift();
  }

  // Resolve aliases
  let resolved = input;
  for (const [alias, expansion] of Object.entries(session.aliases)) {
    if (resolved === alias || resolved.startsWith(alias + " ")) {
      resolved = expansion + resolved.slice(alias.length);
      break;
    }
  }

  // Parse command and args
  const parts = parseArgs(resolved);
  const cmd = parts[0];
  const args = parts.slice(1);

  const handlers = {
    help: cmdHelp,
    ls: cmdLs,
    ll: (s, a) => cmdLs(s, ["-la", ...a]),
    la: (s, a) => cmdLs(s, ["-A", ...a]),
    cd: cmdCd,
    pwd: cmdPwd,
    cat: cmdCat,
    echo: cmdEcho,
    mkdir: cmdMkdir,
    rmdir: cmdRmdir,
    rm: cmdRm,
    touch: cmdTouch,
    cp: cmdCp,
    mv: cmdMv,
    find: cmdFind,
    grep: cmdGrep,
    head: cmdHead,
    tail: cmdTail,
    wc: cmdWc,
    sort: cmdSort,
    uniq: cmdUniq,
    tr: cmdTr,
    cut: cmdCut,
    sed: cmdSed,
    awk: cmdAwk,
    less: cmdLess,
    more: cmdMore,
    clear: cmdClear,
    neofetch: cmdNeofetch,
    uname: cmdUname,
    whoami: cmdWhoami,
    id: cmdId,
    hostname: cmdHostname,
    date: cmdDate,
    cal: cmdCal,
    uptime: cmdUptime,
    df: cmdDf,
    du: cmdDu,
    free: cmdFree,
    top: cmdTop,
    htop: cmdHtop,
    ps: cmdPs,
    kill: cmdKill,
    killall: cmdKillall,
    env: cmdEnv,
    export: cmdExport,
    unset: cmdUnset,
    alias: cmdAlias,
    unalias: cmdUnalias,
    history: cmdHistory,
    which: cmdWhich,
    whereis: cmdWhereis,
    man: cmdMan,
    info: cmdInfo,
    pacman: cmdPacman,
    yay: cmdYay,
    paru: cmdParu,
    systemctl: cmdSystemctl,
    journalctl: cmdJournalctl,
    dmesg: cmdDmesg,
    lsblk: cmdLsblk,
    lscpu: cmdLscpu,
    lsusb: cmdLsusb,
    lspci: cmdLspci,
    lsmem: cmdLsmem,
    lshw: cmdLshw,
    fdisk: cmdFdisk,
    mount: cmdMount,
    umount: cmdUmount,
    ip: cmdIp,
    ifconfig: cmdIfconfig,
    ss: cmdSs,
    netstat: cmdNetstat,
    nmap: cmdNmap,
    curl: cmdCurl,
    wget: cmdWget,
    ssh: cmdSsh,
    scp: cmdScp,
    rsync: cmdRsync,
    tar: cmdTar,
    gzip: cmdGzip,
    gunzip: cmdGunzip,
    zip: cmdZip,
    unzip: cmdUnzip,
    chmod: cmdChmod,
    chown: cmdChown,
    chgrp: cmdChgrp,
    stat: cmdStat,
    file: cmdFile,
    diff: cmdDiff,
    patch: cmdPatch,
    ln: cmdLn,
    readlink: cmdReadlink,
    basename: cmdBasename,
    dirname: cmdDirname,
    printf: cmdPrintf,
    sleep: cmdSleep,
    time: cmdTime,
    watch: cmdWatch,
    xargs: cmdXargs,
    tee: cmdTee,
    yes: cmdYes,
    seq: cmdSeq,
    shuf: cmdShuf,
    rev: cmdRev,
    fold: cmdFold,
    expand: cmdExpand,
    unexpand: cmdUnexpand,
    nl: cmdNl,
    strings: cmdStrings,
    xxd: cmdXxd,
    od: cmdOd,
    base64: cmdBase64,
    md5sum: cmdMd5sum,
    sha256sum: cmdSha256sum,
    sha512sum: cmdSha512sum,
    passwd: cmdPasswd,
    su: cmdSu,
    sudo: cmdSudo,
    groups: cmdGroups,
    users: cmdUsers,
    last: cmdLast,
    w: cmdW,
    who: cmdWho,
    finger: cmdFinger,
    write: cmdWrite,
    wall: cmdWall,
    bc: cmdBc,
    dc: cmdDc,
    factor: cmdFactor,
    expr: cmdExpr,
    true: () => ({ output: "", cwd: session.cwd }),
    false: () => ({ output: "1", cwd: session.cwd, exitCode: 1 }),
    ":": () => ({ output: "", cwd: session.cwd }),
    test: cmdTest,
    "[": cmdTest,
    vim: cmdVim,
    vi: cmdVim,
    nano: cmdNano,
    emacs: cmdEmacs,
    cowsay: cmdCowsay,
    cowthink: cmdCowthink,
    fortune: cmdFortune,
    figlet: cmdFiglet,
    lolcat: cmdLolcat,
    toilet: cmdToilet,
    cmatrix: cmdCmatrix,
    sl: cmdSl,
    banner: cmdBanner,
    asciiart: cmdAsciiart,
    weather: cmdWeather,
    joke: cmdJoke,
    riddle: cmdRiddle,
    quote: cmdQuote,
    fact: cmdFact,
    hack: cmdHack,
    matrix: cmdMatrix,
    fire: cmdFire,
    starwars: cmdStarwars,
    tetris: cmdTetris,
    snake: cmdSnake,
    2048: cmd2048,
    chess: cmdChess,
    calc: cmdCalc,
    units: cmdUnits,
    ipcalc: cmdIpcalc,
    numfmt: cmdNumfmt,
    printf2: cmdPrintf,
    type: cmdType,
    readelf: cmdReadelf,
    nm: cmdNm,
    strace: cmdStrace,
    ltrace: cmdLtrace,
    ldd: cmdLdd,
    objdump: cmdObjdump,
    git: cmdGit,
    make: cmdMake,
    gcc: cmdGcc,
    python: cmdPython,
    python3: cmdPython,
    node: cmdNode,
    lua: cmdLua,
    ruby: cmdRuby,
    perl: cmdPerl,
    bash: cmdBash,
    sh: cmdBash,
    zsh: cmdZsh,
    fish: cmdFish,
    exit: cmdExit,
    logout: cmdExit,
    reboot: cmdReboot,
    shutdown: cmdShutdown,
    poweroff: cmdPoweroff,
    halt: cmdPoweroff,
  };

  const handler = handlers[cmd];
  if (handler) {
    try {
      return handler(session, args);
    } catch (e) {
      return { output: `bash: ${cmd}: internal error: ${e.message}`, cwd: session.cwd };
    }
  }

  // Check if it looks like a path
  if (cmd.startsWith("./") || cmd.startsWith("/")) {
    return { output: `bash: ${cmd}: Permission denied`, cwd: session.cwd };
  }

  return {
    output: `bash: ${cmd}: command not found\nDid you mean one of: ${getSuggestions(cmd, Object.keys(handlers))}`,
    cwd: session.cwd,
  };
}

function parseArgs(input) {
  const args = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (c === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (c === " " && !inSingle && !inDouble) {
      if (current) args.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current) args.push(current);
  return args;
}

function getSuggestions(cmd, available) {
  const scored = available
    .map((a) => {
      let score = 0;
      for (let i = 0; i < Math.min(cmd.length, a.length); i++) {
        if (cmd[i] === a[i]) score++;
      }
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.a);
  return scored.join(", ") || "help";
}

// ============================================================
//  COMMAND IMPLEMENTATIONS
// ============================================================

function cmdHelp(session, args) {
  const output = `
Arch Linux Terminal Simulator - Available Commands
==================================================

FILE SYSTEM:
  ls, ll, la       List directory contents
  cd               Change directory
  pwd              Print working directory
  cat              Print file contents
  echo             Print text
  mkdir            Create directory
  rmdir            Remove directory
  rm               Remove files/dirs
  touch            Create/update file
  cp               Copy files
  mv               Move/rename files
  find             Search for files
  grep             Search in files
  head, tail       First/last lines of file
  wc               Word/line count
  sort, uniq       Sort and deduplicate
  tr               Translate characters
  cut              Extract columns
  sed              Stream editor
  awk              Pattern processing
  ln               Create links
  stat             File status
  file             File type
  diff             Compare files
  chmod, chown     File permissions
  du               Disk usage

TEXT PROCESSING:
  less, more       Pager
  rev              Reverse text
  fold             Wrap lines
  nl               Number lines
  strings          Print strings
  base64           Base64 encode/decode
  md5sum           MD5 checksum
  sha256sum        SHA-256 checksum
  xxd              Hex dump
  figlet           Large ASCII text
  cowsay           ASCII cow says
  cowthink         ASCII cow thinks
  fortune          Random quotes
  lolcat           Rainbow text
  toilet           ASCII art text

SYSTEM INFO:
  neofetch         System info + Arch logo
  uname            Kernel info
  whoami           Current user
  id               User/group IDs
  hostname         System hostname
  date             Current date/time
  cal              Calendar
  uptime           System uptime
  df               Disk free space
  du               Disk usage
  free             Memory usage
  top, htop        Process monitor
  ps               Process list
  lsblk            Block devices
  lscpu            CPU info
  lsusb            USB devices
  lspci            PCI devices
  lsmem, lshw      Memory/hardware info

NETWORKING:
  ip               Network interfaces
  ifconfig         Interface config
  ss               Socket statistics
  netstat          Network statistics
  nmap             Port scanner (simulated)
  curl             HTTP requests (simulated)
  wget             File download (simulated)
  ssh              Secure shell (simulated)
  ipcalc           IP calculator

PACKAGE MANAGEMENT:
  pacman           Arch package manager
  yay              AUR helper
  paru             AUR helper

SYSTEM SERVICES:
  systemctl        Service control
  journalctl       System logs
  dmesg            Kernel messages

ARCHIVE & COMPRESS:
  tar              Archive files
  gzip, gunzip     Compress/decompress
  zip, unzip       ZIP archives

USER MANAGEMENT:
  passwd           Change password
  su, sudo         Switch user
  groups           Show groups
  users, who, w    Logged-in users
  last             Login history
  finger           User info

MATH & UTILS:
  bc               Calculator
  expr             Evaluate expression
  factor           Factorize numbers
  seq              Generate sequences
  shuf             Shuffle lines
  sleep            Pause execution
  time             Time a command
  numfmt           Format numbers
  units            Unit converter
  calc             Scientific calculator

DEVELOPMENT:
  vim, nano        Text editors (simulated)
  git              Version control (simulated)
  make             Build system (simulated)
  gcc              C compiler (simulated)
  python, python3  Python interpreter
  node             Node.js REPL (simulated)
  lua, ruby, perl  Scripting (simulated)
  bash, sh, zsh    Shells (simulated)

FUN:
  cmatrix          Matrix rain effect
  sl               Steam locomotive
  asciiart         ASCII art gallery
  weather          Fake weather report
  joke             Random programmer joke
  riddle           Random riddle
  quote            Random Linux quote
  fact             Random Linux fact
  hack             Hollywood hacker mode
  matrix           Matrix animation
  fire             Fire animation
  starwars         ASCII Star Wars
  cowsay           Cow says something
  fortune | cowsay Pipe commands!
  2048             2048 game (text)

SHELL:
  alias            List/set aliases
  unalias          Remove alias
  export, unset    Environment vars
  env              Show environment
  history          Command history
  which, whereis   Find commands
  man, info        Manual pages
  type             Command type
  clear            Clear terminal
  exit, logout     Exit shell

Use 'man <command>' for detailed help.
`.trim();
  return { output, cwd: session.cwd };
}

function cmdLs(session, args) {
  let showHidden = false;
  let longFormat = false;
  let humanReadable = false;
  let showAll = false;
  let paths = [];

  for (const a of args) {
    if (a.startsWith("-")) {
      if (a.includes("a")) showHidden = true;
      if (a.includes("A")) showAll = true;
      if (a.includes("l")) longFormat = true;
      if (a.includes("h")) humanReadable = true;
    } else {
      paths.push(a);
    }
  }

  if (paths.length === 0) paths = [session.cwd];

  const lines = [];
  for (const p of paths) {
    const targetPath = resolvePath(session.cwd, p);
    const node = getNode(session.vfs, targetPath);

    if (!node) {
      lines.push(`ls: cannot access '${p}': No such file or directory`);
      continue;
    }

    if (node.type === "file") {
      if (longFormat) {
        lines.push(`${node.perms} 1 ${node.owner} ${node.owner} ${String(node.size).padStart(8)} ${node.mtime} ${basename(targetPath)}`);
      } else {
        lines.push(basename(targetPath));
      }
      continue;
    }

    const children = getChildren(session.vfs, targetPath);
    if (paths.length > 1) lines.push(`${targetPath}:`);

    let entries = children.map((c) => {
      const name = basename(c);
      const n = session.vfs[c];
      return { name, path: c, node: n };
    });

    // Add . and ..
    if (showHidden) {
      entries.unshift({ name: ".", path: targetPath, node: node });
      entries.unshift({ name: "..", path: dirname(targetPath), node: session.vfs[dirname(targetPath)] || node });
    }

    if (!showHidden && !showAll) {
      entries = entries.filter((e) => !e.name.startsWith("."));
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    if (longFormat) {
      let total = 0;
      for (const e of entries) total += Math.ceil((e.node?.size || 4096) / 512);
      lines.push(`total ${total}`);
      for (const e of entries) {
        const n = e.node || { perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: "Jan  1 00:00", type: "dir" };
        lines.push(`${n.perms} 1 ${n.owner} ${n.owner} ${String(n.size).padStart(8)} ${n.mtime} ${n.name}`);
      }
    } else {
      lines.push(entries.map((e) => e.name).join("  "));
    }
  }

  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdCd(session, args) {
  const target = args[0] || "/home/user";
  const targetPath = resolvePath(session.cwd, target);
  const node = getNode(session.vfs, targetPath);
  if (!node) return { output: `bash: cd: ${target}: No such file or directory`, cwd: session.cwd };
  if (node.type !== "dir") return { output: `bash: cd: ${target}: Not a directory`, cwd: session.cwd };
  session.cwd = targetPath;
  return { output: "", cwd: session.cwd };
}

function cmdPwd(session, args) {
  return { output: session.cwd, cwd: session.cwd };
}

function cmdCat(session, args) {
  if (args.length === 0) return { output: "cat: missing operand\nUsage: cat [OPTION]... [FILE]...", cwd: session.cwd };
  let showLineNumbers = false;
  const files = [];
  for (const a of args) {
    if (a === "-n") showLineNumbers = true;
    else files.push(a);
  }
  const lines = [];
  for (const f of files) {
    const p = resolvePath(session.cwd, f);
    const node = getNode(session.vfs, p);
    if (!node) { lines.push(`cat: ${f}: No such file or directory`); continue; }
    if (node.type === "dir") { lines.push(`cat: ${f}: Is a directory`); continue; }
    const content = node.content || "";
    if (showLineNumbers) {
      content.split("\n").forEach((l, i) => lines.push(`${String(i + 1).padStart(6)}\t${l}`));
    } else {
      lines.push(content);
    }
  }
  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdEcho(session, args) {
  let newline = true;
  let escapes = false;
  const textArgs = [];
  for (const a of args) {
    if (a === "-n") newline = false;
    else if (a === "-e") escapes = true;
    else textArgs.push(a);
  }
  let out = textArgs.join(" ");
  // Expand env vars
  out = out.replace(/\$(\w+)/g, (_, name) => session.env[name] || "");
  if (escapes) out = out.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
  return { output: newline ? out : out, cwd: session.cwd };
}

function cmdMkdir(session, args) {
  if (!args.length) return { output: "mkdir: missing operand", cwd: session.cwd };
  let parents = false;
  const dirs = [];
  for (const a of args) {
    if (a === "-p") parents = true;
    else dirs.push(a);
  }
  for (const d of dirs) {
    const p = resolvePath(session.cwd, d);
    if (session.vfs[p]) { if (!parents) return { output: `mkdir: cannot create directory '${d}': File exists`, cwd: session.cwd }; continue; }
    const parent = dirname(p);
    if (!session.vfs[parent] && !parents) return { output: `mkdir: cannot create directory '${d}': No such file or directory`, cwd: session.cwd };
    session.vfs[p] = { type: "dir", perms: "drwxr-xr-x", owner: "user", size: 4096, mtime: getDate() };
  }
  return { output: "", cwd: session.cwd };
}

function cmdRmdir(session, args) {
  if (!args.length) return { output: "rmdir: missing operand", cwd: session.cwd };
  for (const d of args) {
    const p = resolvePath(session.cwd, d);
    if (!session.vfs[p]) return { output: `rmdir: failed to remove '${d}': No such file or directory`, cwd: session.cwd };
    if (session.vfs[p].type !== "dir") return { output: `rmdir: failed to remove '${d}': Not a directory`, cwd: session.cwd };
    if (getChildren(session.vfs, p).length > 0) return { output: `rmdir: failed to remove '${d}': Directory not empty`, cwd: session.cwd };
    delete session.vfs[p];
  }
  return { output: "", cwd: session.cwd };
}

function cmdRm(session, args) {
  let recursive = false, force = false;
  const files = [];
  for (const a of args) {
    if (a.includes("r") || a.includes("R")) recursive = true;
    if (a.includes("f")) force = true;
    if (!a.startsWith("-")) files.push(a);
  }
  if (!files.length) return { output: "rm: missing operand", cwd: session.cwd };
  for (const f of files) {
    const p = resolvePath(session.cwd, f);
    if (!session.vfs[p]) {
      if (!force) return { output: `rm: cannot remove '${f}': No such file or directory`, cwd: session.cwd };
      continue;
    }
    if (session.vfs[p].type === "dir" && !recursive) {
      return { output: `rm: cannot remove '${f}': Is a directory`, cwd: session.cwd };
    }
    // Delete node and all children
    const toDelete = Object.keys(session.vfs).filter((k) => k === p || k.startsWith(p + "/"));
    for (const k of toDelete) delete session.vfs[k];
  }
  return { output: "", cwd: session.cwd };
}

function cmdTouch(session, args) {
  if (!args.length) return { output: "touch: missing file operand", cwd: session.cwd };
  for (const f of args) {
    const p = resolvePath(session.cwd, f);
    if (!session.vfs[p]) {
      session.vfs[p] = { type: "file", perms: "-rw-r--r--", owner: "user", size: 0, mtime: getDate(), content: "" };
    } else {
      session.vfs[p].mtime = getDate();
    }
  }
  return { output: "", cwd: session.cwd };
}

function cmdCp(session, args) {
  let recursive = false;
  const files = [];
  for (const a of args) {
    if (a === "-r" || a === "-R" || a === "-a") recursive = true;
    else files.push(a);
  }
  if (files.length < 2) return { output: "cp: missing destination file operand", cwd: session.cwd };
  const dst = files.pop();
  for (const src of files) {
    const sp = resolvePath(session.cwd, src);
    const dp = resolvePath(session.cwd, dst);
    const snode = session.vfs[sp];
    if (!snode) return { output: `cp: cannot stat '${src}': No such file or directory`, cwd: session.cwd };
    if (snode.type === "dir" && !recursive) return { output: `cp: -r not specified; omitting directory '${src}'`, cwd: session.cwd };
    // Simple copy
    const dnode = session.vfs[dp];
    const finalDst = dnode && dnode.type === "dir" ? dp + "/" + basename(sp) : dp;
    session.vfs[finalDst] = { ...snode, mtime: getDate() };
  }
  return { output: "", cwd: session.cwd };
}

function cmdMv(session, args) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length < 2) return { output: "mv: missing destination file operand", cwd: session.cwd };
  const dst = files.pop();
  for (const src of files) {
    const sp = resolvePath(session.cwd, src);
    const dp = resolvePath(session.cwd, dst);
    if (!session.vfs[sp]) return { output: `mv: cannot stat '${src}': No such file or directory`, cwd: session.cwd };
    const dnode = session.vfs[dp];
    const finalDst = dnode && dnode.type === "dir" ? dp + "/" + basename(sp) : dp;
    session.vfs[finalDst] = { ...session.vfs[sp], mtime: getDate() };
    delete session.vfs[sp];
  }
  return { output: "", cwd: session.cwd };
}

function cmdFind(session, args) {
  let startPath = session.cwd;
  let nameFilter = null;
  let typeFilter = null;
  let i = 0;
  if (args[0] && !args[0].startsWith("-")) { startPath = resolvePath(session.cwd, args[0]); i = 1; }
  while (i < args.length) {
    if (args[i] === "-name") { nameFilter = args[++i]; i++; }
    else if (args[i] === "-type") { typeFilter = args[++i]; i++; }
    else i++;
  }
  const results = Object.keys(session.vfs).filter((p) => {
    if (!p.startsWith(startPath)) return false;
    const node = session.vfs[p];
    const name = basename(p);
    if (typeFilter) {
      if (typeFilter === "f" && node.type !== "file") return false;
      if (typeFilter === "d" && node.type !== "dir") return false;
    }
    if (nameFilter) {
      const pattern = nameFilter.replace(/\*/g, ".*").replace(/\?/g, ".");
      if (!new RegExp(`^${pattern}$`).test(name)) return false;
    }
    return true;
  });
  return { output: results.join("\n"), cwd: session.cwd };
}

function cmdGrep(session, args) {
  let recursive = false, ignoreCase = false, lineNumbers = false, invertMatch = false, count = false;
  let pattern = null;
  const files = [];
  for (const a of args) {
    if (a.startsWith("-")) {
      if (a.includes("r") || a.includes("R")) recursive = true;
      if (a.includes("i")) ignoreCase = true;
      if (a.includes("n")) lineNumbers = true;
      if (a.includes("v")) invertMatch = true;
      if (a.includes("c")) count = true;
    } else if (!pattern) {
      pattern = a;
    } else {
      files.push(a);
    }
  }
  if (!pattern) return { output: "Usage: grep [OPTION]... PATTERN [FILE]...", cwd: session.cwd };
  const regex = new RegExp(pattern, ignoreCase ? "i" : "");
  const lines = [];
  const searchFile = (p, label) => {
    const node = session.vfs[p];
    if (!node || node.type !== "file") return;
    const content = (node.content || "").split("\n");
    let matchCount = 0;
    content.forEach((line, idx) => {
      const matches = regex.test(line);
      if (matches !== invertMatch) {
        matchCount++;
        if (!count) {
          const prefix = files.length > 1 ? `${label}:` : "";
          const lineNum = lineNumbers ? `${idx + 1}:` : "";
          lines.push(`${prefix}${lineNum}${line}`);
        }
      }
    });
    if (count) lines.push(files.length > 1 ? `${label}:${matchCount}` : String(matchCount));
  };
  if (!files.length) return { output: "grep: no input files", cwd: session.cwd };
  for (const f of files) {
    const p = resolvePath(session.cwd, f);
    searchFile(p, f);
  }
  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdHead(session, args) {
  let n = 10;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n" && args[i + 1]) { n = parseInt(args[++i]); }
    else if (args[i].match(/^-\d+$/)) { n = parseInt(args[i].slice(1)); }
    else files.push(args[i]);
  }
  if (!files.length) return { output: "head: missing file operand", cwd: session.cwd };
  const out = [];
  for (const f of files) {
    const p = resolvePath(session.cwd, f);
    const node = session.vfs[p];
    if (!node) { out.push(`head: cannot open '${f}': No such file or directory`); continue; }
    if (files.length > 1) out.push(`==> ${f} <==`);
    out.push((node.content || "").split("\n").slice(0, n).join("\n"));
  }
  return { output: out.join("\n"), cwd: session.cwd };
}

function cmdTail(session, args) {
  let n = 10;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n" && args[i + 1]) { n = parseInt(args[++i]); }
    else if (args[i].match(/^-\d+$/)) { n = parseInt(args[i].slice(1)); }
    else files.push(args[i]);
  }
  if (!files.length) return { output: "tail: missing file operand", cwd: session.cwd };
  const out = [];
  for (const f of files) {
    const p = resolvePath(session.cwd, f);
    const node = session.vfs[p];
    if (!node) { out.push(`tail: cannot open '${f}': No such file or directory`); continue; }
    if (files.length > 1) out.push(`==> ${f} <==`);
    const lines = (node.content || "").split("\n");
    out.push(lines.slice(-n).join("\n"));
  }
  return { output: out.join("\n"), cwd: session.cwd };
}

function cmdWc(session, args) {
  let countLines = false, countWords = false, countBytes = false;
  const files = [];
  for (const a of args) {
    if (a === "-l") countLines = true;
    else if (a === "-w") countWords = true;
    else if (a === "-c" || a === "-m") countBytes = true;
    else files.push(a);
  }
  if (!countLines && !countWords && !countBytes) { countLines = countWords = countBytes = true; }
  if (!files.length) return { output: "wc: missing file operand", cwd: session.cwd };
  const out = [];
  let tl = 0, tw = 0, tb = 0;
  for (const f of files) {
    const p = resolvePath(session.cwd, f);
    const node = session.vfs[p];
    if (!node) { out.push(`wc: ${f}: No such file or directory`); continue; }
    const content = node.content || "";
    const l = content.split("\n").length;
    const w = content.trim().split(/\s+/).filter(Boolean).length;
    const b = content.length;
    tl += l; tw += w; tb += b;
    let line = "";
    if (countLines) line += `${String(l).padStart(7)}`;
    if (countWords) line += `${String(w).padStart(7)}`;
    if (countBytes) line += `${String(b).padStart(7)}`;
    out.push(`${line} ${f}`);
  }
  if (files.length > 1) {
    let line = "";
    if (countLines) line += `${String(tl).padStart(7)}`;
    if (countWords) line += `${String(tw).padStart(7)}`;
    if (countBytes) line += `${String(tb).padStart(7)}`;
    out.push(`${line} total`);
  }
  return { output: out.join("\n"), cwd: session.cwd };
}

function cmdSort(session, args) {
  let reverse = false, unique = false, numeric = false;
  const files = [];
  for (const a of args) {
    if (a === "-r") reverse = true;
    else if (a === "-u") unique = true;
    else if (a === "-n") numeric = true;
    else files.push(a);
  }
  let lines = [];
  if (files.length) {
    for (const f of files) {
      const p = resolvePath(session.cwd, f);
      const node = session.vfs[p];
      if (!node) continue;
      lines.push(...(node.content || "").split("\n"));
    }
  }
  lines.sort(numeric ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b));
  if (reverse) lines.reverse();
  if (unique) lines = [...new Set(lines)];
  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdUniq(session, args) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (!files.length) return { output: "uniq: missing operand", cwd: session.cwd };
  const p = resolvePath(session.cwd, files[0]);
  const node = session.vfs[p];
  if (!node) return { output: `uniq: ${files[0]}: No such file or directory`, cwd: session.cwd };
  const lines = (node.content || "").split("\n");
  const result = lines.filter((l, i) => l !== lines[i - 1]);
  return { output: result.join("\n"), cwd: session.cwd };
}

function cmdTr(session, args) {
  if (args.length < 2) return { output: "Usage: tr SET1 SET2", cwd: session.cwd };
  return { output: `tr: (interactive mode not supported, pipe input required)`, cwd: session.cwd };
}
function cmdCut(session, args) {
  return { output: `cut: (requires input - use: echo 'text' | cut -d: -f1)`, cwd: session.cwd };
}
function cmdSed(session, args) {
  if (!args.length) return { output: "Usage: sed SCRIPT [FILE]...", cwd: session.cwd };
  const files = args.filter((a) => !a.startsWith("-") && !a.startsWith("s/") && !a.startsWith("d") && !a.startsWith("p"));
  return { output: `sed: expression applied (simulated). Use cat to view file contents.`, cwd: session.cwd };
}
function cmdAwk(session, args) {
  return { output: `awk: (simulated) Pattern processing applied.`, cwd: session.cwd };
}
function cmdLess(session, args) {
  if (!args.length) return { output: "less: missing filename", cwd: session.cwd };
  return cmdCat(session, args);
}
function cmdMore(session, args) { return cmdLess(session, args); }
function cmdClear(session, args) { return { output: "\x1b[2J\x1b[H", cwd: session.cwd, clear: true }; }

function cmdNeofetch(session, args) {
  const ascii = ARCH_ASCII;
  const info = [
    `\x1b[1;36muser\x1b[0m@\x1b[1;36marchbtw\x1b[0m`,
    `\x1b[1;36m-----------------\x1b[0m`,
    `\x1b[1;36mOS\x1b[0m: Arch Linux x86_64`,
    `\x1b[1;36mHost\x1b[0m: Virtual Machine`,
    `\x1b[1;36mKernel\x1b[0m: 6.8.9-arch1-1`,
    `\x1b[1;36mUptime\x1b[0m: ${randomUptime()}`,
    `\x1b[1;36mPackages\x1b[0m: 1337 (pacman), 142 (flatpak)`,
    `\x1b[1;36mShell\x1b[0m: bash 5.2.26`,
    `\x1b[1;36mResolution\x1b[0m: 1920x1080`,
    `\x1b[1;36mDE\x1b[0m: KDE Plasma 6.0.4`,
    `\x1b[1;36mWM\x1b[0m: KWin`,
    `\x1b[1;36mWM Theme\x1b[0m: Breeze Dark`,
    `\x1b[1;36mTheme\x1b[0m: Breeze Dark [KDE]`,
    `\x1b[1;36mIcons\x1b[0m: Papirus-Dark`,
    `\x1b[1;36mTerminal\x1b[0m: Konsole 24.02.2`,
    `\x1b[1;36mCPU\x1b[0m: AMD Ryzen 9 7950X (32) @ 5.085GHz`,
    `\x1b[1;36mGPU\x1b[0m: NVIDIA GeForce RTX 4090`,
    `\x1b[1;36mMemory\x1b[0m: ${randomMemUsed()}`,
    ``,
    `\x1b[40m   \x1b[41m   \x1b[42m   \x1b[43m   \x1b[44m   \x1b[45m   \x1b[46m   \x1b[47m   \x1b[0m`,
    `\x1b[100m   \x1b[101m   \x1b[102m   \x1b[103m   \x1b[104m   \x1b[105m   \x1b[106m   \x1b[107m   \x1b[0m`,
  ];

  const lines = [];
  const maxLen = Math.max(ascii.length, info.length);
  for (let i = 0; i < maxLen; i++) {
    const a = (ascii[i] || "").padEnd(40);
    const inf = info[i] || "";
    lines.push(`\x1b[1;36m${a}\x1b[0m  ${inf}`);
  }
  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdUname(session, args) {
  const all = args.includes("-a");
  const kernel = args.includes("-r") || all;
  const nodename = args.includes("-n") || all;
  const machine = args.includes("-m") || all;
  const processor = args.includes("-p") || all;
  const os = args.includes("-o") || all;
  const sysname = !args.length || all;
  const parts = [];
  if (sysname) parts.push("Linux");
  if (nodename) parts.push("archbtw");
  if (kernel) parts.push("6.8.9-arch1-1");
  if (all) parts.push("#1 SMP PREEMPT_DYNAMIC Thu, 16 May 2024 22:29:16 +0000");
  if (machine || all) parts.push("x86_64");
  if (processor) parts.push("unknown");
  if (os) parts.push("GNU/Linux");
  return { output: parts.join(" "), cwd: session.cwd };
}

function cmdWhoami(session, args) { return { output: "user", cwd: session.cwd }; }

function cmdId(session, args) {
  return { output: "uid=1000(user) gid=1000(user) groups=1000(user),3(sys),90(network),98(power),986(video),987(audio),988(storage),998(wheel)", cwd: session.cwd };
}

function cmdHostname(session, args) { return { output: "archbtw", cwd: session.cwd }; }

function cmdDate(session, args) {
  const now = new Date();
  const fmt = args.find((a) => a.startsWith("+"));
  if (fmt) {
    let s = fmt.slice(1);
    s = s.replace("%Y", now.getFullYear());
    s = s.replace("%m", String(now.getMonth() + 1).padStart(2, "0"));
    s = s.replace("%d", String(now.getDate()).padStart(2, "0"));
    s = s.replace("%H", String(now.getHours()).padStart(2, "0"));
    s = s.replace("%M", String(now.getMinutes()).padStart(2, "0"));
    s = s.replace("%S", String(now.getSeconds()).padStart(2, "0"));
    s = s.replace("%A", ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()]);
    return { output: s, cwd: session.cwd };
  }
  return { output: now.toString(), cwd: session.cwd };
}

function cmdCal(session, args) {
  const now = new Date();
  const month = args[0] ? parseInt(args[0]) - 1 : now.getMonth();
  const year = args[1] ? parseInt(args[1]) : now.getFullYear();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const header = `${months[month]} ${year}`.padStart(20).padEnd(20);
  const lines = [header, "Su Mo Tu We Th Fr Sa"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let row = "   ".repeat(firstDay);
  for (let d = 1; d <= daysInMonth; d++) {
    row += String(d).padStart(2) + " ";
    if ((d + firstDay) % 7 === 0) { lines.push(row.trimEnd()); row = ""; }
  }
  if (row.trim()) lines.push(row.trimEnd());
  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdUptime(session, args) {
  const ut = randomUptime();
  return { output: ` 12:34:56 up ${ut},  1 user,  load average: 0.52, 0.48, 0.41`, cwd: session.cwd };
}

function cmdDf(session, args) {
  const human = args.includes("-h");
  const header = `Filesystem      ${human ? "Size  Used Avail Use%" : "1K-blocks    Used Available Use%"} Mounted on`;
  const rows = [
    `${human ? "dev          tmpfs  16G     0   16G   0%" : "tmpfs        16777216        0  16777216   0%"} /dev`,
    `${human ? "/dev/sda1    ext4  256G   47G  196G  20%" : "/dev/sda1   268435456 50331648 209715200  20%"} /`,
    `${human ? "tmpfs        tmpfs  16G   1.2M   16G   1%" : "tmpfs        16777216     1229  16775987   1%"} /tmp`,
  ];
  return { output: [header, ...rows].join("\n"), cwd: session.cwd };
}

function cmdDu(session, args) {
  const human = args.includes("-h");
  const path = args.find((a) => !a.startsWith("-")) || session.cwd;
  const p = resolvePath(session.cwd, path);
  const nodes = Object.keys(session.vfs).filter((k) => k.startsWith(p));
  let total = nodes.reduce((s, k) => s + (session.vfs[k].size || 4096), 0);
  const size = human ? `${Math.ceil(total / 1024)}K` : Math.ceil(total / 1024);
  return { output: `${size}\t${path}`, cwd: session.cwd };
}

function cmdFree(session, args) {
  const human = args.includes("-h");
  if (human) {
    return {
      output: `              total        used        free      shared  buff/cache   available\nMem:           32Gi       6.1Gi        19Gi       312Mi       6.7Gi        25Gi\nSwap:          8.0Gi          0B       8.0Gi`,
      cwd: session.cwd,
    };
  }
  return {
    output: `              total        used        free      shared  buff/cache   available\nMem:        33554432     6291456    19922944      319488     7340032    26214400\nSwap:        8388608           0     8388608`,
    cwd: session.cwd,
  };
}

function cmdTop(session, args) {
  return {
    output: `top - 12:34:56 up ${randomUptime()},  1 user,  load average: 0.52, 0.48, 0.41\nTasks: 247 total,   1 running, 246 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  3.2 us,  0.8 sy,  0.0 ni, 95.4 id,  0.5 wa,  0.0 hi,  0.1 si,  0.0 st\nMiB Mem :  32768.0 total,  19456.0 free,   6144.0 used,   7168.0 buff/cache\nMiB Swap:   8192.0 total,   8192.0 free,      0.0 used.  25600.0 avail Mem\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n    1 root      20   0  169812   9372   7108 S   0.0   0.0   0:01.52 systemd\n  512 user      20   0  512000  48000  12000 S   2.1   0.1   1:23.45 plasmashell\n  613 user      20   0  256000  24000   8000 S   0.5   0.0   0:12.34 konsole\n  987 user      20   0 1024000  96000  16000 S   1.2   0.3   2:34.56 firefox\n 1234 user      20   0   48000   4096   3200 R   0.3   0.0   0:00.01 top\n(Press q to quit - simulated, press any key)`,
    cwd: session.cwd,
  };
}

function cmdHtop(session, args) {
  return {
    output: `htop (simulated)\n\nCPU  [\x1b[1;32m|||||||||||||||                           \x1b[0m 23.4%]\nMem  [\x1b[1;34m|||||||||||||||||||||||||||                \x1b[0m 6144M/32768M]\nSwp  [\x1b[1;31m                                           \x1b[0m 0K/8192M]\n\n  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command\n    1 root       20   0  170M  9372  7108 S  0.0  0.0  0:01.52 systemd\n  512 user       20   0  512M  48M   12M  S  2.1  0.1  1:23.45 plasmashell\n  613 user       20   0  256M  24M    8M  S  0.5  0.0  0:12.34 konsole\n  987 user       20   0 1024M  96M   16M  S  1.2  0.3  2:34.56 firefox\nF1Help F2Setup F3Search F4Filter F5Tree F6SortBy F7Nice- F8Nice+ F9Kill F10Quit`,
    cwd: session.cwd,
  };
}

function cmdPs(session, args) {
  const aux = args.some((a) => a.includes("a") || a.includes("u") || a.includes("x"));
  if (aux) {
    return {
      output: `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.0 169812  9372 ?        Ss   Jan01   0:01 /sbin/init\nroot         512  0.0  0.0  65536  4096 ?        S    Jan01   0:00 /usr/lib/systemd/systemd-journald\nuser         987  1.2  0.3 1048576 98304 ?       Sl   Jan01   2:34 /usr/lib/firefox/firefox\nuser        1024  0.0  0.0  48000  4096 pts/0    Ss   12:00   0:00 bash\nuser        1234  0.0  0.0  35000  2048 pts/0    R+   12:34   0:00 ps aux`,
      cwd: session.cwd,
    };
  }
  return {
    output: `  PID TTY          TIME CMD\n 1024 pts/0    00:00:00 bash\n 1234 pts/0    00:00:00 ps`,
    cwd: session.cwd,
  };
}

function cmdKill(session, args) {
  if (!args.length) return { output: "Usage: kill [-signal] pid...", cwd: session.cwd };
  return { output: ``, cwd: session.cwd };
}
function cmdKillall(session, args) {
  if (!args.length) return { output: "killall: no process name specified", cwd: session.cwd };
  return { output: ``, cwd: session.cwd };
}

function cmdEnv(session, args) {
  return { output: Object.entries(session.env).map(([k, v]) => `${k}=${v}`).join("\n"), cwd: session.cwd };
}

function cmdExport(session, args) {
  if (!args.length) return cmdEnv(session, args);
  for (const a of args) {
    const [k, v] = a.split("=");
    if (v !== undefined) session.env[k] = v;
  }
  return { output: "", cwd: session.cwd };
}

function cmdUnset(session, args) {
  for (const a of args) delete session.env[a];
  return { output: "", cwd: session.cwd };
}

function cmdAlias(session, args) {
  if (!args.length) return { output: Object.entries(session.aliases).map(([k, v]) => `alias ${k}='${v}'`).join("\n"), cwd: session.cwd };
  for (const a of args) {
    const eq = a.indexOf("=");
    if (eq >= 0) session.aliases[a.slice(0, eq)] = a.slice(eq + 1).replace(/^'|'$/g, "");
  }
  return { output: "", cwd: session.cwd };
}

function cmdUnalias(session, args) {
  for (const a of args) delete session.aliases[a];
  return { output: "", cwd: session.cwd };
}

function cmdHistory(session, args) {
  return { output: session.history.map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`).join("\n"), cwd: session.cwd };
}

function cmdWhich(session, args) {
  if (!args.length) return { output: "which: missing argument", cwd: session.cwd };
  const paths = { bash: "/bin/bash", sh: "/bin/sh", zsh: "/bin/zsh", fish: "/usr/bin/fish", python: "/usr/bin/python", python3: "/usr/bin/python3", vim: "/usr/bin/vim", nano: "/usr/bin/nano", git: "/usr/bin/git", pacman: "/usr/bin/pacman", yay: "/usr/bin/yay", ls: "/usr/bin/ls", grep: "/usr/bin/grep", find: "/usr/bin/find", cat: "/usr/bin/cat", echo: "/usr/bin/echo", curl: "/usr/bin/curl", wget: "/usr/bin/wget", gcc: "/usr/bin/gcc", make: "/usr/bin/make", systemctl: "/usr/bin/systemctl", neofetch: "/usr/bin/neofetch", htop: "/usr/bin/htop", node: "/usr/bin/node" };
  const out = args.map((a) => paths[a] || `which: no ${a} in (/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin)`);
  return { output: out.join("\n"), cwd: session.cwd };
}

function cmdWhereis(session, args) {
  if (!args.length) return { output: "whereis: missing argument", cwd: session.cwd };
  return { output: `${args[0]}: /usr/bin/${args[0]} /usr/share/man/man1/${args[0]}.1.gz`, cwd: session.cwd };
}

function cmdMan(session, args) {
  if (!args.length) return { output: "What manual page do you want?\nFor example, try 'man ls'", cwd: session.cwd };
  const cmd = args[args.length - 1];
  const pages = {
    ls: `LS(1)                    User Commands                   LS(1)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [OPTION]... [FILE]...\n\nDESCRIPTION\n       List information about the FILEs (the current directory by default).\n       Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.\n\n       -a, --all\n              do not ignore entries starting with .\n       -l     use a long listing format\n       -h, --human-readable\n              print sizes in human readable format (e.g., 1K 234M 2G)\n       -r, --reverse\n              reverse order while sorting\n       -t     sort by modification time, newest first`,
    pacman: `PACMAN(8)                    Pacman Manual                   PACMAN(8)\n\nNAME\n       pacman - package manager utility\n\nSYNOPSIS\n       pacman <operation> [options] [packages]\n\nOPERATIONS\n       -S, --sync\n              Synchronize packages\n       -R, --remove\n              Remove packages\n       -Q, --query\n              Query the package database\n       -U, --upgrade\n              Upgrade or add package(s)\n       -Syu   Upgrade all installed packages\n       -Ss    Search for a package\n       -Si    Display information about a package`,
    neofetch: `NEOFETCH(1)                  User Commands                  NEOFETCH(1)\n\nNAME\n       neofetch - A fast, highly customizable system info script\n\nSYNOPSIS\n       neofetch [options]\n\nDESCRIPTION\n       Neofetch displays information about your operating system, software\n       and hardware in an aesthetic and visually pleasing way.\n\n       The overall goal of Neofetch is to be used in screen-shots of your\n       system. Neofetch shows the information other people want to see.`,
  };
  return { output: pages[cmd] || `No manual entry for ${cmd}\nSee 'man man' for help. ('man --help' for usage information)`, cwd: session.cwd };
}

function cmdInfo(session, args) { return cmdMan(session, args); }

function cmdPacman(session, args) {
  if (!args.length) return { output: "error: no operation specified (use -h for help)", cwd: session.cwd };
  const op = args[0];
  const pkg = args.slice(1).find((a) => !a.startsWith("-")) || "";

  if (op === "-Syu" || op === "-Syyu") {
    return {
      output: `:: Synchronizing package databases...\n core is up to date\n extra is up to date\n multilib is up to date\n:: Starting full system upgrade...\n there is nothing to do\n\nSystem is fully up to date!`,
      cwd: session.cwd,
    };
  }
  if (op === "-Ss") {
    const results = [
      `extra/${pkg || "vim"} 9.1.0016-1 [installed]`,
      `    Vi Improved, a highly configurable text editor`,
      `extra/${pkg || "neovim"} 0.9.5-4`,
      `    Fork of Vim aiming to improve user experience, plugins, and GUIs`,
    ];
    return { output: results.join("\n"), cwd: session.cwd };
  }
  if (op === "-S") {
    if (!pkg) return { output: "error: no targets specified (use -h for help)", cwd: session.cwd };
    return {
      output: `resolving dependencies...\nlooking for conflicting packages...\n\nPackages (1) ${pkg}-1.0-1\n\nTotal Installed Size:  1.23 MiB\n\n:: Proceed with installation? [Y/n] Y\n:: Retrieving packages...\n ${pkg}-1.0-1 downloading...\n(1/1) checking keys in keyring               [################################] 100%\n(1/1) checking package integrity             [################################] 100%\n(1/1) loading package files                  [################################] 100%\n(1/1) checking for file conflicts            [################################] 100%\n(1/1) checking available disk space          [################################] 100%\n:: Processing package changes...\n(1/1) installing ${pkg}                      [################################] 100%\n:: Running post-transaction hooks...\n(1/1) Arming ConditionNeedsUpdate...`,
      cwd: session.cwd,
    };
  }
  if (op === "-R" || op === "-Rs") {
    if (!pkg) return { output: "error: no targets specified", cwd: session.cwd };
    return { output: `Removing ${pkg}... done`, cwd: session.cwd };
  }
  if (op === "-Q") {
    return { output: `bash 5.2.026-2\ncoreutils 9.5-1\ncurl 8.8.0-1\ngit 2.45.2-1\nlinux 6.8.9.arch1-1\nnano 8.0-1\nnpm 10.8.1-1\npython 3.12.4-1\nvim 9.1.0016-1`, cwd: session.cwd };
  }
  if (op === "-Qs") {
    return { output: `local/${pkg || "vim"} 9.1.0016-1\n    Vi Improved, a highly configurable text editor`, cwd: session.cwd };
  }
  if (op === "-Si") {
    return {
      output: `Repository      : extra\nName            : ${pkg || "vim"}\nVersion         : 9.1.0016-1\nDescription     : Vi Improved, a highly configurable text editor\nURL             : https://www.vim.org\nLicenses        : custom:vim\nDepends On      : gpm  libxt  libsm  hicolor-icon-theme  desktop-file-utils\nOptional Deps   : python: Python scripting support\nInstall Reason  : Explicitly installed\nInstall Date    : Mon 01 Jan 2024 00:00:00\nInstalled Size  : 3.87 MiB`,
      cwd: session.cwd,
    };
  }
  return { output: `pacman: invalid option -- '${op.slice(1)}'\nTry 'pacman --help' for more information.`, cwd: session.cwd };
}

function cmdYay(session, args) {
  if (!args.length) return { output: "yay: no operation specified\nUsage: yay [options] <package>", cwd: session.cwd };
  const pkg = args.find((a) => !a.startsWith("-")) || "";
  if (args[0] === "-Ss" || args[0] === "--search") {
    return { output: `aur/${pkg || "yay"} 12.3.5-1 [AUR]\n    Yet another yogurt - An AUR Helper written in Go\naur/${pkg || "paru"} 2.0.2-1 [AUR]\n    Feature packed AUR helper`, cwd: session.cwd };
  }
  return { output: `yay: Delegating to pacman...\n${cmdPacman(session, args).output}`, cwd: session.cwd };
}

function cmdParu(session, args) { return cmdYay(session, args); }

function cmdSystemctl(session, args) {
  const sub = args[0];
  const unit = args[1] || "";
  const services = {
    "NetworkManager": "active (running)",
    "sshd": "inactive (dead)",
    "bluetooth": "active (running)",
    "cups": "inactive (dead)",
    "docker": "inactive (dead)",
    "nginx": "inactive (dead)",
    "postgresql": "inactive (dead)",
    "firewalld": "active (running)",
  };
  if (sub === "status") {
    const state = services[unit] || "inactive (dead)";
    return {
      output: `\u25CF ${unit}.service - ${unit}\n     Loaded: loaded (/usr/lib/systemd/system/${unit}.service; enabled)\n     Active: ${state}\n   Main PID: 1234 (${unit})\n      Tasks: 3\n     CGroup: /system.slice/${unit}.service\n             \u2514\u25001234 /usr/sbin/${unit}`,
      cwd: session.cwd,
    };
  }
  if (sub === "start" || sub === "stop" || sub === "restart" || sub === "enable" || sub === "disable") {
    return { output: `(simulated) systemctl ${sub} ${unit}: OK`, cwd: session.cwd };
  }
  if (sub === "list-units" || sub === "list-unit-files" || !sub) {
    return {
      output: `  UNIT                        LOAD   ACTIVE SUB     DESCRIPTION\n  NetworkManager.service      loaded active running Network Manager\n  bluetooth.service           loaded active running Bluetooth service\n  firewalld.service           loaded active running firewalld\n  sshd.service                loaded failed failed  OpenSSH Daemon\n  cups.service                loaded inactive dead   Printing Service\n\nLEGEND: LOAD   = Reflects whether the unit definition was properly loaded.\n        ACTIVE = The high-level unit activation state\n        SUB    = The low-level unit activation state`,
      cwd: session.cwd,
    };
  }
  return { output: `systemctl: unknown operation '${sub}'`, cwd: session.cwd };
}

function cmdJournalctl(session, args) {
  return {
    output: `-- Boot 1234abcd (current boot) --\nJan 01 00:00:01 archbtw systemd[1]: Starting system...\nJan 01 00:00:02 archbtw kernel: Linux version 6.8.9-arch1-1\nJan 01 00:00:03 archbtw kernel: Booting paravirtualized kernel on bare-metal\nJan 01 00:00:05 archbtw systemd-networkd[512]: eth0: Link UP\nJan 01 00:00:06 archbtw NetworkManager[513]: <info> NetworkManager (version 1.46.0)\nJan 01 00:00:07 archbtw sddm[987]: Starting...\n-- lines 1-8/8 (END) --`,
    cwd: session.cwd,
  };
}

function cmdDmesg(session, args) {
  return {
    output: `[    0.000000] Linux version 6.8.9-arch1-1 (linux@archlinux)\n[    0.000000] BIOS-provided physical RAM map:\n[    0.000000] ACPI: RSDP 0x00000000000F05B0 000024 (v02 BOCHS )\n[    0.001234] PCI: Using configuration type 1 for base access\n[    0.005678] clocksource: tsc-early: mask: 0xffffffffffffffff\n[    0.012345] kernel: pid_max: default: 32768 minimum: 301\n[    0.023456] Memory: 32768MB/32768MB available\n[    0.034567] SCSI subsystem initialized\n[    0.045678] ACPI: AC adapter [AC0] (on-line)\n[    1.234567] audit: type=1130 audit(0): pid=1 uid=0 ses=4294967295 subj=kernel msg='unit=NetworkManager'`,
    cwd: session.cwd,
  };
}

function cmdLsblk(session, args) {
  return {
    output: `NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0 256G  0 disk\n├─sda1   8:1    0   512M  0 part /boot\n├─sda2   8:2    0   8G    0 part [SWAP]\n└─sda3   8:3    0 247.5G 0 part /\nsdb      8:16   1  32G    0 disk\n└─sdb1   8:17   1  32G    0 part /run/media/user/USB`,
    cwd: session.cwd,
  };
}

function cmdLscpu(session, args) {
  return {
    output: `Architecture:                    x86_64\nCPU op-mode(s):                  32-bit, 64-bit\nByte Order:                      Little Endian\nAddress sizes:                   48 bits physical, 48 bits virtual\nCPU(s):                          32\nOn-line CPU(s) list:             0-31\nThread(s) per core:              2\nCore(s) per socket:              16\nSocket(s):                       1\nVendor ID:                       AuthenticAMD\nModel name:                      AMD Ryzen 9 7950X 16-Core Processor\nCPU MHz:                         5084.697\nCPU max MHz:                     5759.0000\nCPU min MHz:                     400.0000\nBogoMIPS:                        9600.00\nVirtualization:                  AMD-V\nL1d cache:                       512 KiB (16 instances)\nL1i cache:                       512 KiB (16 instances)\nL2 cache:                        16 MiB (16 instances)\nL3 cache:                        64 MiB (2 instances)`,
    cwd: session.cwd,
  };
}

function cmdLsusb(session, args) {
  return {
    output: `Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub\nBus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub\nBus 001 Device 002: ID 8087:0026 Intel Corp. AX201 Bluetooth\nBus 001 Device 003: ID 045e:00f5 Microsoft Corp. LifeCam VX-3000\nBus 002 Device 002: ID 0781:5567 SanDisk Corp. Cruzer Blade`,
    cwd: session.cwd,
  };
}

function cmdLspci(session, args) {
  return {
    output: `00:00.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Device 14d8\n00:02.0 VGA compatible controller: NVIDIA Corporation GA102 [GeForce RTX 4090]\n00:04.0 Audio device: NVIDIA Corporation GA102 High Definition Audio Controller\n00:1f.0 ISA bridge: Intel Corporation Z790 Chipset LPC Controller\n00:1f.3 Audio device: Intel Corporation Raptor Lake High Definition Audio\n02:00.0 Non-Volatile memory controller: Samsung Electronics Co Ltd NVMe SSD Controller PM9A1/PM9A3/980PRO`,
    cwd: session.cwd,
  };
}

function cmdLsmem(session, args) {
  return {
    output: `RANGE                                  SIZE  STATE REMOVABLE BLOCK\n0x0000000000000000-0x000000007fffffff    2G online       yes  0-15\n0x0000000100000000-0x000000087fffffff   30G online       yes 32-271\n\nMemory block size:       128M\nTotal online memory:      32G\nTotal offline memory:      0B`,
    cwd: session.cwd,
  };
}

function cmdLshw(session, args) {
  return {
    output: `archbtw\n    description: Computer\n    product: Virtual Machine\n  *-core\n       description: Motherboard\n    *-cpu\n          product: AMD Ryzen 9 7950X 16-Core Processor\n          capacity: 5GHz\n          width: 64 bits\n    *-memory\n          description: System Memory\n          size: 32GiB\n    *-display\n          product: NVIDIA GeForce RTX 4090\n          vendor: nVidia Corporation\n          capacity: 1GiB`,
    cwd: session.cwd,
  };
}

function cmdFdisk(session, args) {
  if (args.includes("-l")) {
    return {
      output: `Disk /dev/sda: 256 GiB, 274877906944 bytes, 536870912 sectors\nDisk model: SAMSUNG MZVLB256\nUnits: sectors of 1 * 512 = 512 bytes\nSector size (logical/physical): 512 bytes / 512 bytes\n\nDevice     Boot   Start       End   Sectors  Size Id Type\n/dev/sda1  *       2048   1048575   1046528  511M 83 Linux\n/dev/sda2       1048576  17825791  16777216    8G 82 Linux swap\n/dev/sda3      17825792 536870911 519045120 247.5G 83 Linux`,
      cwd: session.cwd,
    };
  }
  return { output: `fdisk: cannot open /dev/sda: Permission denied (run as root)`, cwd: session.cwd };
}

function cmdMount(session, args) {
  if (!args.length) {
    return {
      output: `proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\ndevtmpfs on /dev type devtmpfs (rw,nosuid,size=16384k,nr_inodes=4096,mode=755)\n/dev/sda3 on / type ext4 (rw,relatime)\n/dev/sda1 on /boot type vfat (rw,relatime,fmask=0022,dmask=0022)\ntmpfs on /tmp type tmpfs (rw,nosuid,nodev)`,
      cwd: session.cwd,
    };
  }
  return { output: `mount: simulated - ${args.join(" ")}`, cwd: session.cwd };
}

function cmdUmount(session, args) { return { output: "", cwd: session.cwd }; }

function cmdIp(session, args) {
  const sub = args.find((a) => !a.startsWith("-")) || "addr";
  if (sub === "addr" || sub === "a") {
    return {
      output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n    inet6 ::1/128 scope host\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP\n    link/ether 52:54:00:ab:cd:ef brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0\n    inet6 fe80::5054:ff:feab:cdef/64 scope link`,
      cwd: session.cwd,
    };
  }
  if (sub === "route" || sub === "r") {
    return {
      output: `default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.100 metric 100\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100`,
      cwd: session.cwd,
    };
  }
  return { output: `ip: unknown object "${sub}"`, cwd: session.cwd };
}

function cmdIfconfig(session, args) {
  return {
    output: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\n        inet6 fe80::5054:ff:feab:cdef  prefixlen 64  scopeid 0x20<link>\n        ether 52:54:00:ab:cd:ef  txqueuelen 1000  (Ethernet)\n        RX packets 10245  bytes 12345678 (11.7 MiB)\n        TX packets 8432  bytes 987654 (964.5 KiB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        loop  txqueuelen 1000  (Local Loopback)`,
    cwd: session.cwd,
  };
}

function cmdSs(session, args) {
  return {
    output: `Netid  State   Recv-Q  Send-Q  Local Address:Port    Peer Address:Port\ntcp    LISTEN  0       128     0.0.0.0:22           0.0.0.0:*\ntcp    ESTAB   0       0       192.168.1.100:22     192.168.1.1:54321\nudp    UNCONN  0       0       0.0.0.0:68           0.0.0.0:*`,
    cwd: session.cwd,
  };
}

function cmdNetstat(session, args) { return cmdSs(session, args); }

function cmdNmap(session, args) {
  const target = args.find((a) => !a.startsWith("-")) || "127.0.0.1";
  return {
    output: `Starting Nmap 7.95 ( nmap.org ) at ${new Date().toLocaleString()}\nNmap scan report for ${target}\nHost is up (0.00045s latency).\nNot shown: 996 closed tcp ports (reset)\nPORT     STATE SERVICE  VERSION\n22/tcp   open  ssh      OpenSSH 9.7 (protocol 2.0)\n80/tcp   open  http     nginx 1.26.0\n443/tcp  open  https    nginx 1.26.0\n3306/tcp open  mysql    MySQL 8.4.0\n\nNmap done: 1 IP address (1 host up) scanned in 0.42 seconds`,
    cwd: session.cwd,
  };
}

function cmdCurl(session, args) {
  const url = args.find((a) => !a.startsWith("-")) || "";
  if (!url) return { output: "curl: try 'curl --help' for more information", cwd: session.cwd };
  return { output: `curl: (6) Could not resolve host: ${url.replace(/https?:\/\//, "").split("/")[0]}\n(Note: External HTTP requests are not available in this simulation)`, cwd: session.cwd };
}

function cmdWget(session, args) {
  const url = args.find((a) => !a.startsWith("-")) || "";
  if (!url) return { output: "wget: missing URL", cwd: session.cwd };
  return { output: `--2024-01-01 12:00:00-- ${url}\nResolving ${url.split("/")[2]}... failed: Name or service not known.\nwget: unable to resolve host address '${url.split("/")[2]}'`, cwd: session.cwd };
}

function cmdSsh(session, args) {
  const host = args.find((a) => !a.startsWith("-")) || "";
  if (!host) return { output: "usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] destination [command]", cwd: session.cwd };
  return { output: `ssh: connect to host ${host} port 22: Network is unreachable`, cwd: session.cwd };
}

function cmdScp(session, args) { return { output: "scp: Network is unreachable", cwd: session.cwd }; }
function cmdRsync(session, args) { return { output: "rsync: [Errno 101] Network is unreachable", cwd: session.cwd }; }

function cmdTar(session, args) {
  if (!args.length) return { output: "tar: need to specify one of: -c, -x, -t\nTry 'tar --help' for more information.", cwd: session.cwd };
  const isCreate = args.includes("-c") || args.some((a) => a.includes("c") && a.startsWith("-"));
  const isExtract = args.includes("-x") || args.some((a) => a.includes("x") && a.startsWith("-"));
  const isVerbose = args.includes("-v") || args.some((a) => a.includes("v") && a.startsWith("-"));
  const files = args.filter((a) => !a.startsWith("-"));
  if (isCreate) return { output: isVerbose ? files.join("\n") : "", cwd: session.cwd };
  if (isExtract) return { output: isVerbose ? `Extracting ${files[0] || "archive.tar"}...` : "", cwd: session.cwd };
  return { output: "", cwd: session.cwd };
}

function cmdGzip(session, args) { return { output: `${args[0] || "file"}.gz`, cwd: session.cwd }; }
function cmdGunzip(session, args) { return { output: "", cwd: session.cwd }; }
function cmdZip(session, args) { return { output: `  adding: ${(args[1] || "file")} (deflated 42%)`, cwd: session.cwd }; }
function cmdUnzip(session, args) { return { output: `Archive:  ${args[0] || "file.zip"}\n  inflating: contents/file.txt`, cwd: session.cwd }; }

function cmdChmod(session, args) {
  if (args.length < 2) return { output: "chmod: missing operand", cwd: session.cwd };
  const [mode, ...files] = args.filter((a) => !a.startsWith("-") || a.match(/^-[rwx]/));
  return { output: "", cwd: session.cwd };
}
function cmdChown(session, args) { return { output: "", cwd: session.cwd }; }
function cmdChgrp(session, args) { return { output: "", cwd: session.cwd }; }

function cmdStat(session, args) {
  if (!args.length) return { output: "stat: missing operand", cwd: session.cwd };
  const p = resolvePath(session.cwd, args[0]);
  const node = session.vfs[p];
  if (!node) return { output: `stat: cannot stat '${args[0]}': No such file or directory`, cwd: session.cwd };
  return {
    output: `  File: ${args[0]}\n  Size: ${node.size}\t\tBlocks: ${Math.ceil(node.size / 512)}\t IO Block: 4096\t${node.type === "dir" ? "directory" : "regular file"}\nDevice: fd01h/64769d\tInode: ${Math.floor(Math.random() * 99999) + 10000}\tLinks: 1\nAccess: (0644/${node.perms})\tUid: ( 1000/ user)\tGid: ( 1000/ user)\nAccess: 2024-01-01 00:00:00.000000000 +0000\nModify: 2024-01-01 00:00:00.000000000 +0000\nChange: 2024-01-01 00:00:00.000000000 +0000`,
    cwd: session.cwd,
  };
}

function cmdFile(session, args) {
  if (!args.length) return { output: "file: missing operand", cwd: session.cwd };
  const p = resolvePath(session.cwd, args[0]);
  const node = session.vfs[p];
  if (!node) return { output: `${args[0]}: ERROR: No such file or directory`, cwd: session.cwd };
  if (node.type === "dir") return { output: `${args[0]}: directory`, cwd: session.cwd };
  const ext = args[0].split(".").pop();
  const types = { sh: "Bourne-Again shell script, ASCII text executable", py: "Python script, ASCII text executable", js: "Node.js script, ASCII text executable", txt: "ASCII text", md: "ASCII text", conf: "ASCII text", c: "C source, ASCII text", cpp: "C++ source, ASCII text", h: "C header, ASCII text" };
  return { output: `${args[0]}: ${types[ext] || "ASCII text"}`, cwd: session.cwd };
}

function cmdDiff(session, args) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length < 2) return { output: "diff: missing operand\nUsage: diff [OPTION]... FILES", cwd: session.cwd };
  return { output: `--- ${files[0]}\t2024-01-01 00:00:00\n+++ ${files[1]}\t2024-01-01 00:00:01\n@@ -1,3 +1,3 @@\n-old content\n+new content`, cwd: session.cwd };
}

function cmdPatch(session, args) { return { output: "patching file (simulated)", cwd: session.cwd }; }
function cmdLn(session, args) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length < 2) return { output: "ln: missing file operand", cwd: session.cwd };
  const src = resolvePath(session.cwd, files[0]);
  const dst = resolvePath(session.cwd, files[1]);
  if (!session.vfs[src]) return { output: `ln: failed to access '${files[0]}': No such file or directory`, cwd: session.cwd };
  session.vfs[dst] = { ...session.vfs[src] };
  return { output: "", cwd: session.cwd };
}
function cmdReadlink(session, args) { return { output: args[0] || "", cwd: session.cwd }; }
function cmdBasename(session, args) { return { output: basename(args[0] || ""), cwd: session.cwd }; }
function cmdDirname(session, args) { return { output: dirname(args[0] || "/"), cwd: session.cwd }; }
function cmdPrintf(session, args) { return { output: args.join(" "), cwd: session.cwd }; }
function cmdSleep(session, args) { return { output: "", cwd: session.cwd }; }
function cmdTime(session, args) { return { output: `real\t0m0.001s\nuser\t0m0.001s\nsys\t0m0.000s`, cwd: session.cwd }; }
function cmdWatch(session, args) { return { output: `watch: simulated - would run '${args.slice(1).join(" ")}' every 2 seconds`, cwd: session.cwd }; }
function cmdXargs(session, args) { return { output: `xargs: (simulated)`, cwd: session.cwd }; }
function cmdTee(session, args) { return { output: "", cwd: session.cwd }; }
function cmdYes(session, args) { return { output: Array(20).fill(args[0] || "y").join("\n"), cwd: session.cwd }; }
function cmdSeq(session, args) {
  if (!args.length) return { output: "Usage: seq LAST\n  or: seq FIRST LAST\n  or: seq FIRST INCREMENT LAST", cwd: session.cwd };
  let first = 1, increment = 1, last;
  if (args.length === 1) last = parseInt(args[0]);
  else if (args.length === 2) { first = parseInt(args[0]); last = parseInt(args[1]); }
  else { first = parseInt(args[0]); increment = parseInt(args[1]); last = parseInt(args[2]); }
  const out = [];
  for (let i = first; increment > 0 ? i <= last : i >= last; i += increment) out.push(i);
  return { output: out.slice(0, 1000).join("\n"), cwd: session.cwd };
}
function cmdShuf(session, args) {
  const files = args.filter((a) => !a.startsWith("-"));
  const n = parseInt(args[args.indexOf("-n") + 1]) || 0;
  if (!files.length) return { output: "shuf: no input specified", cwd: session.cwd };
  const p = resolvePath(session.cwd, files[0]);
  const node = session.vfs[p];
  if (!node) return { output: `shuf: ${files[0]}: No such file or directory`, cwd: session.cwd };
  const lines = (node.content || "").split("\n").sort(() => Math.random() - 0.5);
  return { output: (n ? lines.slice(0, n) : lines).join("\n"), cwd: session.cwd };
}
function cmdRev(session, args) {
  if (args.length) {
    const p = resolvePath(session.cwd, args[0]);
    const node = session.vfs[p];
    if (!node) return { output: `rev: ${args[0]}: No such file or directory`, cwd: session.cwd };
    return { output: (node.content || "").split("\n").map((l) => l.split("").reverse().join("")).join("\n"), cwd: session.cwd };
  }
  return { output: "(rev: reads from stdin, pipe input required)", cwd: session.cwd };
}
function cmdFold(session, args) {
  const w = parseInt(args[args.indexOf("-w") + 1]) || 80;
  return { output: `fold: wrapping at ${w} columns (simulated)`, cwd: session.cwd };
}
function cmdExpand(session, args) { return { output: "(expand: converting tabs to spaces - simulated)", cwd: session.cwd }; }
function cmdUnexpand(session, args) { return { output: "(unexpand: converting spaces to tabs - simulated)", cwd: session.cwd }; }
function cmdNl(session, args) {
  if (!args.length) return { output: "nl: missing operand", cwd: session.cwd };
  const p = resolvePath(session.cwd, args[0]);
  const node = session.vfs[p];
  if (!node) return { output: `nl: ${args[0]}: No such file or directory`, cwd: session.cwd };
  return { output: (node.content || "").split("\n").map((l, i) => `${String(i + 1).padStart(6)}\t${l}`).join("\n"), cwd: session.cwd };
}
function cmdStrings(session, args) {
  if (!args.length) return { output: "strings: missing operand", cwd: session.cwd };
  return { output: `(strings: binary analysis - simulated)\n/usr/lib/libreadline.so\nGNU readline library\nversion 8.2`, cwd: session.cwd };
}
function cmdXxd(session, args) {
  if (!args.length) return { output: "xxd: missing operand", cwd: session.cwd };
  return { output: `00000000: 2321 2f62 696e 2f62 6173 680a 0a23 207e  #!/bin/bash..# ~\n00000010: 2f2e 6261 7368 7263 3a20 6578 6563 7574  /.bashrc: execut\n...`, cwd: session.cwd };
}
function cmdOd(session, args) { return { output: `0000000 042523 064457 067143 020141  \n0000010 067542 072163 000012`, cwd: session.cwd }; }
function cmdBase64(session, args) {
  const decode = args.includes("-d") || args.includes("--decode");
  if (decode) return { output: "(decoded text)", cwd: session.cwd };
  return { output: "SGVsbG8gQXJjaCBMaW51eCBVc2VyIQ==", cwd: session.cwd };
}
function cmdMd5sum(session, args) {
  if (!args.length) return { output: "Usage: md5sum [FILE]...", cwd: session.cwd };
  return { output: args.map((f) => `d41d8cd98f00b204e9800998ecf8427e  ${f}`).join("\n"), cwd: session.cwd };
}
function cmdSha256sum(session, args) {
  if (!args.length) return { output: "Usage: sha256sum [FILE]...", cwd: session.cwd };
  return { output: args.map((f) => `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ${f}`).join("\n"), cwd: session.cwd };
}
function cmdSha512sum(session, args) {
  if (!args.length) return { output: "Usage: sha512sum [FILE]...", cwd: session.cwd };
  return { output: args.map((f) => `cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e  ${f}`).join("\n"), cwd: session.cwd };
}
function cmdPasswd(session, args) { return { output: "Changing password for user.\nCurrent password: \nNew password: \nRetype new password: \npasswd: password updated successfully (simulated)", cwd: session.cwd }; }
function cmdSu(session, args) { return { output: "su: Authentication failure (simulated - no root in this terminal)", cwd: session.cwd }; }
function cmdSudo(session, args) {
  const cmd = args.join(" ");
  if (!cmd) return { output: "usage: sudo [-D level] -h | -K | -k | -V\nusage: sudo -v [-AknS] [-g group] [-h host] [-p prompt] [-u user]\nusage: sudo -l [-AknS] [-g group] [-h host] [-p prompt] [-u user] [command]", cwd: session.cwd };
  return { output: `[sudo] password for user: \n(simulated - sudo not available in this terminal)`, cwd: session.cwd };
}
function cmdGroups(session, args) { return { output: "user sys network power video audio storage wheel", cwd: session.cwd }; }
function cmdUsers(session, args) { return { output: "user", cwd: session.cwd }; }
function cmdLast(session, args) { return { output: `user     pts/0        192.168.1.1      Mon Jan  1 12:00   still logged in\nuser     pts/0        192.168.1.1      Sun Dec 31 23:45 - 00:30  (00:45)\nreboot   system boot  6.8.9-arch1-1    Mon Jan  1 00:00   still running\n\nwtmp begins Mon Jan  1 00:00:00 2024`, cwd: session.cwd }; }
function cmdW(session, args) { return { output: ` 12:34:56 up ${randomUptime()},  1 user,  load average: 0.52, 0.48, 0.41\nUSER     TTY        LOGIN@   IDLE JCPU   PCPU WHAT\nuser     pts/0     12:00   0.00s  0.03s  0.00s bash`, cwd: session.cwd }; }
function cmdWho(session, args) { return { output: `user     pts/0        2024-01-01 12:00 (192.168.1.1)`, cwd: session.cwd }; }
function cmdFinger(session, args) { return { output: `Login: user\t\t\tName: Arch User\nDirectory: /home/user\t\tShell: /bin/bash\nOn since Mon Jan  1 12:00 (UTC) on pts/0 from 192.168.1.1\nNo mail.\nNo Plan.`, cwd: session.cwd }; }
function cmdWrite(session, args) { return { output: "write: user is not logged in (simulated)", cwd: session.cwd }; }
function cmdWall(session, args) { return { output: `\nBroadcast message from user (pts/0) (Mon Jan  1 12:34:56 2024):\n\n${args.join(" ")}`, cwd: session.cwd }; }

function cmdBc(session, args) {
  return { output: `bc (GNU bc) 1.07.1\nCopyright 1991-1994, 1997, 1998, 2000, 2004, 2006, 2008, 2012-2017 Free Software Foundation, Inc.\nbc is interactive (simulated). Type 'quit' to exit.\n\nNote: Use 'calc' command for calculations.`, cwd: session.cwd };
}
function cmdDc(session, args) { return { output: "(dc: RPN calculator - simulated)", cwd: session.cwd }; }
function cmdFactor(session, args) {
  if (!args.length) return { output: "factor: missing operand", cwd: session.cwd };
  const n = parseInt(args[0]);
  if (isNaN(n) || n < 1) return { output: `factor: invalid argument '${args[0]}'`, cwd: session.cwd };
  const factors = [];
  let num = n;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    while (num % i === 0) { factors.push(i); num /= i; }
  }
  if (num > 1) factors.push(num);
  return { output: `${n}: ${factors.join(" ")}`, cwd: session.cwd };
}
function cmdExpr(session, args) {
  try {
    const expr = args.join(" ").replace(/\\\*/g, "*");
    const result = Function(`"use strict"; return (${expr.replace(/[^0-9+\-*/%() ]/g, "")})`)();
    return { output: String(result), cwd: session.cwd };
  } catch {
    return { output: `expr: syntax error`, cwd: session.cwd };
  }
}
function cmdTest(session, args) { return { output: "", cwd: session.cwd }; }
function cmdVim(session, args) {
  if (!args.length) return { output: `VIM - Vi IMproved 9.1 (2024 Jan 01)\nSimulated vim. Use 'cat' to view files, 'echo' to write.\n:q to quit (simulated)`, cwd: session.cwd };
  return { output: `vim: opening ${args[0]} (simulated)\nUse 'cat ${args[0]}' to view contents.\nVim interactive mode not available in web terminal.`, cwd: session.cwd };
}
function cmdNano(session, args) {
  if (!args.length) return { output: `GNU nano 8.0\n[ New File ]`, cwd: session.cwd };
  return { output: `nano: opening ${args[0]} (simulated)\nUse 'cat ${args[0]}' to view, nano interactive not available.`, cwd: session.cwd };
}
function cmdEmacs(session, args) { return { output: `GNU Emacs 29.3 (simulated)\nC-x C-c to quit, C-x C-f to open file.`, cwd: session.cwd }; }

function cmdCowsay(session, args) {
  const text = args.filter((a) => !a.startsWith("-")).join(" ") || "Moo!";
  const top = "_".repeat(text.length + 2);
  const bot = "-".repeat(text.length + 2);
  return {
    output: ` ${top}\n< ${text} >\n ${bot}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`,
    cwd: session.cwd,
  };
}
function cmdCowthink(session, args) {
  const text = args.filter((a) => !a.startsWith("-")).join(" ") || "Hmm...";
  const top = "_".repeat(text.length + 2);
  const bot = "-".repeat(text.length + 2);
  return {
    output: ` ${top}\n( ${text} )\n ${bot}\n        o   ^__^\n         o  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`,
    cwd: session.cwd,
  };
}

const FORTUNES = [
  "I use Arch, BTW.",
  "rm -rf / --no-preserve-root   [NEVER RUN THIS]",
  "Unix is user-friendly. It's just selective about who its friends are.",
  "There are 10 types of people in the world: those who understand binary and those who don't.",
  "Linux: the only OS where rm -rf / is considered a teaching moment.",
  "My code doesn't have bugs, it has undocumented features.",
  "Git commit -m 'fixed stuff'  -- every developer ever",
  "The best thing about a boolean is even if you are wrong, you are only off by a bit.",
  "Programming is like writing a book... except if you miss one comma, the whole plot makes no sense.",
  "Arch Linux: Because sometimes you want to feel accomplished just for having a working OS.",
  "// TODO: understand this code before deleting it",
  "Error: Success!",
  "99 little bugs in the code, 99 little bugs. Take one down, patch it around. 127 little bugs in the code.",
  "chmod 777 everything -- famous last words",
  "Have you tried turning it off and on again?",
  "Real programmers don't use IDEs. They stare into the void until the void writes code for them.",
  "sudo make me a sandwich",
  "echo 'I love Arch Linux' >> /etc/motd",
  "pacman -Syu solved all my problems. Once.",
  "Simplicity is the ultimate sophistication. -- Arch Linux wiki user",
];

function cmdFortune(session, args) {
  return { output: FORTUNES[Math.floor(Math.random() * FORTUNES.length)], cwd: session.cwd };
}

function cmdFiglet(session, args) {
  const text = args.join(" ") || "Arch";
  const chars = {
    A: ["  /\\  ", " /  \\ ", "/____\\", "/    \\"],
    B: ["|\\ /|", "| - |", "| - |", "|___/"],
    C: [" /--", "|   ", "|   ", " \\--"],
    D: ["|\\  ", "| \\ ", "|  \\", "|__/"],
    R: ["|-- ", "| / ", "|\\  ", "| \\ "],
    H: ["|  |", "|--|", "|  |", "|  |"],
    " ": ["    ", "    ", "    ", "    "],
  };
  // Fallback big text using simple ASCII banners
  const line1 = [], line2 = [], line3 = [], line4 = [];
  for (const ch of text.toUpperCase().slice(0, 12)) {
    const c = chars[ch] || ["####", "#   ", "#   ", "####"];
    line1.push(c[0] || "    "); line2.push(c[1] || "    ");
    line3.push(c[2] || "    "); line4.push(c[3] || "    ");
  }
  return { output: [line1.join(" "), line2.join(" "), line3.join(" "), line4.join(" ")].join("\n"), cwd: session.cwd };
}

function cmdLolcat(session, args) {
  const text = args.join(" ") || "Hello, World!";
  const colors = ["\x1b[31m", "\x1b[33m", "\x1b[32m", "\x1b[36m", "\x1b[34m", "\x1b[35m"];
  const out = text.split("").map((c, i) => `${colors[i % colors.length]}${c}`).join("") + "\x1b[0m";
  return { output: out, cwd: session.cwd };
}

function cmdToilet(session, args) {
  const text = args.filter((a) => !a.startsWith("-")).join(" ") || "ARCH";
  return {
    output: `TOIlet ${text}\n\n ooooo  oooooooo8 oooooooo8 ooooo   ooooo\n  888  888      888          888   888\n  888  888       888oooooo   888ooo888\n  888  888              888  888   888\no888o   888oooo88 88oooo888 o888o o888o\n\n(toilet - simulated figlet-compatible renderer)`,
    cwd: session.cwd,
  };
}

function cmdCmatrix(session, args) {
  const rows = [];
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
  for (let i = 0; i < 20; i++) {
    let row = "\x1b[32m";
    for (let j = 0; j < 60; j++) {
      row += Math.random() < 0.3 ? chars[Math.floor(Math.random() * chars.length)] : " ";
    }
    rows.push(row + "\x1b[0m");
  }
  return { output: rows.join("\n") + "\n\x1b[0m(Press Ctrl+C to quit - simulated)", cwd: session.cwd };
}

function cmdSl(session, args) {
  return {
    output: [
      "                              (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @",
      "                         (   )",
      "                     (@@@@)",
      "                  (    )",
      "               (@@@)",
      "            ====        ________                ___________",
      "        _D _|  |_______/        \\__I_I_____===__|_________|",
      "         |(_)---  |   H\\________/ |   |        =|___ ___|",
      "         /     |  |   H  |  |     |   |         ||_| |_||",
      "        |      |  |   H  |__--------------------| [___] |",
      "        | ________|___H__/__|_____/[][]~\\_______|       |",
      "        |/ |   |-----------I_____I [][] []  D   |=======|__",
      "      __/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__",
      "     |/-=|___|=O=====O=====O=====O|_____/~\\___/          ",
      "      \\_/      \\__/  \\__/  \\__/  \\__/      \\__/",
    ].join("\n"),
    cwd: session.cwd,
  };
}

function cmdBanner(session, args) {
  const text = args.join(" ") || "ARCH";
  return cmdFiglet(session, [text]);
}

function cmdAsciiart(session, args) {
  const arts = {
    penguin: `   .--.\n  |o_o |\n  |:_/ |\n //   \\ \\\n(|     | )\n/'\\_   _/\`\\\n\\___)=(___/`,
    cat: `  /\\_____/\\\n (  o   o  )\n  =( Y )=\n   )   (\n  (_)-(_)`,
    dog: `  / \\__\n (    @\\___\n /         O\n/   (_____/\n/_____/  U`,
    arch: ARCH_ASCII.join("\n"),
    tux: `   .--.    \n  |o_o |   \n  |:_/ |   \n //   \\ \\  \n(|     | ) \n/'\\_   _/\`\\ \n\\___)=(___/ `,
    skull: `    ___\n   /   \\\n  | () |\n   \\___/\n   |||||`,
    pacman: `   \\  |\n    \\ |\nC====O\n    / |\n   /  |`,
    heart: ` ** **\n*****\n **** Arch Love\n  **\n   *`,
  };
  const which = args[0]?.toLowerCase();
  if (which && arts[which]) return { output: arts[which], cwd: session.cwd };
  return {
    output: `Available ASCII arts: ${Object.keys(arts).join(", ")}\nUsage: asciiart <name>`,
    cwd: session.cwd,
  };
}

function cmdWeather(session, args) {
  const city = args.join(" ") || "Arch City";
  const conditions = ["Sunny", "Partly Cloudy", "Overcast", "Light Rain", "Heavy Rain", "Thunderstorm", "Clear", "Foggy"];
  const cond = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = Math.floor(Math.random() * 35) - 5;
  return {
    output: `Weather for ${city}:\n\n  Condition : ${cond}\n  Temp      : ${temp}°C (${Math.round(temp * 9 / 5 + 32)}°F)\n  Humidity  : ${Math.floor(Math.random() * 60) + 30}%\n  Wind      : ${Math.floor(Math.random() * 30) + 5} km/h ${["N","NE","E","SE","S","SW","W","NW"][Math.floor(Math.random()*8)]}\n  Visibility: ${Math.floor(Math.random() * 15) + 5} km\n\n(simulated weather data)`,
    cwd: session.cwd,
  };
}

const JOKES = [
  "Why do programmers prefer dark mode?\n\nBecause light attracts bugs!",
  "A SQL query walks into a bar, walks up to two tables and asks...\n\n'Can I JOIN you?'",
  "How many programmers does it take to change a light bulb?\n\nNone, that's a hardware problem.",
  "Why do Java developers wear glasses?\n\nBecause they don't C#.",
  "A programmer's wife says: 'Go to the store and get a gallon of milk. If they have eggs, get a dozen.'\nThe programmer returns with 12 gallons of milk.",
  "I told my wife I was a Python programmer.\nShe said 'You're a snake in the grass!'",
  "Why did the Linux user get lost?\n\nBecause they forgot to add /home to their PATH.",
  "Debugging is like being the detective in a crime movie where you are also the murderer.",
  "The best code is no code at all. The best comment is none.",
  "It works on my machine.\n[SOLUTION]: Ship the machine.",
  "Why do Arch users love the terminal?\n\nBecause GUIs are for people who can't read man pages.",
];

function cmdJoke(session, args) {
  return { output: JOKES[Math.floor(Math.random() * JOKES.length)], cwd: session.cwd };
}

const RIDDLES = [
  "I have keys but no locks, space but no room, you can enter but can't go inside. What am I?\n\n(Answer: A keyboard)",
  "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?\n\n(Answer: An echo)",
  "The more you take, the more you leave behind. What am I?\n\n(Answer: Footsteps)",
  "I am not alive, but I grow; I don't have lungs, but I need air. What am I?\n\n(Answer: Fire)",
  "What has many keys but can't open a single lock?\n\n(Answer: A piano)",
];

function cmdRiddle(session, args) {
  return { output: RIDDLES[Math.floor(Math.random() * RIDDLES.length)], cwd: session.cwd };
}

const QUOTES = [
  "\"Software is like sex: it's better when it's free.\" — Linus Torvalds",
  "\"Talk is cheap. Show me the code.\" — Linus Torvalds",
  "\"In real open source, you have the right to control your own destiny.\" — Linus Torvalds",
  "\"Microsoft isn't evil, they just make really crappy operating systems.\" — Linus Torvalds",
  "\"The Linux philosophy is 'Laugh in the face of danger'. Oops. Wrong one. 'Do it yourself'. Yes, that's it.\" — Linus Torvalds",
  "\"Programs must be written for people to read, and only incidentally for machines to execute.\" — Harold Abelson",
  "\"Any fool can write code that a computer can understand. Good programmers write code that humans can understand.\" — Martin Fowler",
  "\"Premature optimization is the root of all evil.\" — Donald Knuth",
];

function cmdQuote(session, args) {
  return { output: QUOTES[Math.floor(Math.random() * QUOTES.length)], cwd: session.cwd };
}

const FACTS = [
  "Arch Linux was first released on March 11, 2002, by Judd Vinet.",
  "Arch Linux follows a rolling release model, meaning you never need to reinstall.",
  "The Arch User Repository (AUR) contains over 90,000 packages.",
  "Arch Linux's package manager, pacman, was written in C.",
  "The Arch Linux philosophy is KISS: Keep It Simple, Stupid.",
  "Arch Linux uses a base install with no GUI by default.",
  "The Arch Wiki is widely regarded as the best Linux documentation resource.",
  "Arch Linux uses systemd as its init system since 2012.",
  "The Arch Linux logo is a stylized 'A' with a gradient of blue.",
  "pacman gets its name from its ability to 'eat' packages.",
];

function cmdFact(session, args) {
  return { output: FACTS[Math.floor(Math.random() * FACTS.length)], cwd: session.cwd };
}

function cmdHack(session, args) {
  const lines = [
    "Initializing hack sequence...",
    "Bypassing firewall... [DONE]",
    "Injecting payload... [DONE]",
    "Accessing mainframe... ██████████ 100%",
    "Decrypting RSA-4096... [DONE]",
    "Downloading sensitive data... 1337 files [DONE]",
    "Covering tracks... [DONE]",
    "Uploading to darknet... [DONE]",
    "",
    "\x1b[1;32m[SUCCESS] You are now a 1337 h4x0r.\x1b[0m",
    "(just kidding, this is all fake. Use your skills ethically!)",
  ];
  return { output: lines.join("\n"), cwd: session.cwd };
}

function cmdMatrix(session, args) { return cmdCmatrix(session, args); }
function cmdFire(session, args) {
  const rows = [];
  const fire = [".", ":", "^", "'", "*", "!", "|", "/", "\\", "~"];
  for (let y = 0; y < 12; y++) {
    let row = "";
    const intensity = (12 - y) / 12;
    for (let x = 0; x < 40; x++) {
      const rnd = Math.random();
      const col = rnd < intensity * 0.7 ? "\x1b[31m" : rnd < intensity ? "\x1b[33m" : "\x1b[37m";
      row += col + (Math.random() < intensity ? fire[Math.floor(Math.random() * fire.length)] : " ");
    }
    rows.push(row + "\x1b[0m");
  }
  return { output: rows.join("\n") + "\n\x1b[0m(Fire animation - simulated)", cwd: session.cwd };
}

function cmdStarwars(session, args) {
  return {
    output: `
         A long time ago in a terminal far, far away....

  ._______.___  __  ____    ____  ___       __    __       ___      .______          _______.
  |   ____\\  |/  / \\   \\  /   / /   \\     |  |  |  |     /   \\     |   _  \\        /       |
  |  |__   |  '  /   \\   \\/   / /  ^  \\    |  |  |  |    /  ^  \\    |  |_)  |      |   (----
  |   __|  |    <     \\      / /  /_\\  \\   |  |  |  |   /  /_\\  \\   |      /        \\   \\   
  |  |____ |  .  \\     \\    / /  _____  \\  |  '--'  |  /  _____  \\  |  |\\  \\----.----)   |  
  |_______||__|\\__\\     \\__/ /__/     \\__\\  \\______/ /__/     \\__\\ | _| '._____|_______/   

    It is a period of ricing. Rebel terminals, striking from hidden dotfiles, have won their
    first victory against the evil Microsoft Empire. During the battle, Rebel spies managed to
    steal the plans to the Empire's ultimate weapon, the WINDOWS KEY, a graphical interface
    with enough power to destroy an entire workflow.

    Pursued by the Empire's sinister agents, the Arch User races home aboard their terminal,
    custodian of the stolen plans that can save their productivity and restore freedom to
    the desktop...`,
    cwd: session.cwd,
  };
}

function cmdTetris(session, args) {
  return {
    output: `TETRIS (simulated)\n\n┌──────────────┐\n│ □            │\n│ □□           │\n│  □□□□        │\n│    □□        │\n│   □□□        │\n│ □□□□□        │\n│    □□□□□     │\n└──────────────┘\nScore: 0\n\n(Interactive tetris not supported in web terminal)`,
    cwd: session.cwd,
  };
}

function cmdSnake(session, args) {
  return {
    output: `SNAKE (simulated)\n\n┌──────────────────┐\n│                  │\n│   @@@@@          │\n│       @          │\n│       @   *      │\n│       @          │\n│       @          │\n│                  │\n└──────────────────┘\nScore: 5 | Direction: > \n\n(Interactive snake not supported in web terminal)`,
    cwd: session.cwd,
  };
}

function cmd2048(session, args) {
  return {
    output: `2048 (simulated)\n\n┌────┬────┬────┬────┐\n│ 2  │    │    │    │\n├────┼────┼────┼────┤\n│    │ 4  │    │    │\n├────┼────┼────┼────┤\n│    │    │ 8  │    │\n├────┼────┼────┼────┤\n│    │    │    │ 16 │\n└────┴────┴────┴────┘\nScore: 30\n\n(Interactive 2048 not supported in web terminal)`,
    cwd: session.cwd,
  };
}

function cmdChess(session, args) {
  return {
    output: `CHESS (simulated)\n\n   a b c d e f g h\n 8 r n b q k b n r\n 7 p p p p p p p p\n 6 . . . . . . . .\n 5 . . . . . . . .\n 4 . . . . P . . .\n 3 . . . . . . . .\n 2 P P P P . P P P\n 1 R N B Q K B N R\n\nWhite to move: e2e4 (played)\n\n(Interactive chess not supported in web terminal)`,
    cwd: session.cwd,
  };
}

function cmdCalc(session, args) {
  if (!args.length) return { output: "Usage: calc <expression>\nExample: calc 2 + 2\n         calc 10 * 5\n         calc sqrt 16\n         calc pi", cwd: session.cwd };
  const expr = args.join(" ");
  if (expr === "pi") return { output: "3.141592653589793", cwd: session.cwd };
  if (expr === "e") return { output: "2.718281828459045", cwd: session.cwd };
  if (expr.startsWith("sqrt ")) {
    const n = parseFloat(expr.slice(5));
    return { output: String(Math.sqrt(n)), cwd: session.cwd };
  }
  if (expr.startsWith("sin ")) { return { output: String(Math.sin(parseFloat(expr.slice(4)) * Math.PI / 180)), cwd: session.cwd }; }
  if (expr.startsWith("cos ")) { return { output: String(Math.cos(parseFloat(expr.slice(4)) * Math.PI / 180)), cwd: session.cwd }; }
  if (expr.startsWith("tan ")) { return { output: String(Math.tan(parseFloat(expr.slice(4)) * Math.PI / 180)), cwd: session.cwd }; }
  if (expr.startsWith("log ")) { return { output: String(Math.log10(parseFloat(expr.slice(4)))), cwd: session.cwd }; }
  if (expr.startsWith("ln ")) { return { output: String(Math.log(parseFloat(expr.slice(3)))), cwd: session.cwd }; }
  try {
    const safe = expr.replace(/[^0-9+\-*/%^.()\s]/g, "");
    const result = Function(`"use strict"; return (${safe})`)();
    return { output: String(result), cwd: session.cwd };
  } catch {
    return { output: `calc: invalid expression '${expr}'`, cwd: session.cwd };
  }
}

function cmdUnits(session, args) {
  if (args.length < 3) return { output: "Usage: units <value> <from> <to>\nExample: units 100 km miles", cwd: session.cwd };
  const val = parseFloat(args[0]);
  const from = args[1].toLowerCase();
  const to = args[2].toLowerCase();
  const conversions = {
    "km-miles": (v) => v * 0.621371,
    "miles-km": (v) => v * 1.60934,
    "kg-lbs": (v) => v * 2.20462,
    "lbs-kg": (v) => v / 2.20462,
    "c-f": (v) => v * 9 / 5 + 32,
    "f-c": (v) => (v - 32) * 5 / 9,
    "m-ft": (v) => v * 3.28084,
    "ft-m": (v) => v / 3.28084,
    "l-gal": (v) => v * 0.264172,
    "gal-l": (v) => v / 0.264172,
    "mb-gb": (v) => v / 1024,
    "gb-mb": (v) => v * 1024,
    "gb-tb": (v) => v / 1024,
    "tb-gb": (v) => v * 1024,
  };
  const key = `${from}-${to}`;
  const conv = conversions[key];
  if (!conv) return { output: `units: no conversion from '${from}' to '${to}'\nSupported: km/miles, kg/lbs, c/f, m/ft, l/gal, mb/gb, gb/tb`, cwd: session.cwd };
  return { output: `${val} ${from} = ${conv(val).toFixed(4)} ${to}`, cwd: session.cwd };
}

function cmdIpcalc(session, args) {
  if (!args.length) return { output: "Usage: ipcalc <IP>/<prefix>\nExample: ipcalc 192.168.1.0/24", cwd: session.cwd };
  const input = args[0];
  const [ip, prefix] = input.split("/");
  const p = parseInt(prefix) || 24;
  const mask = (~0 << (32 - p)) >>> 0;
  const maskStr = [(mask >>> 24) & 255, (mask >>> 16) & 255, (mask >>> 8) & 255, mask & 255].join(".");
  const ipParts = ip.split(".").map(Number);
  const network = ipParts.map((b, i) => b & ((mask >>> (24 - i * 8)) & 255)).join(".");
  const broadcast = ipParts.map((b, i) => b | ((~mask >>> (24 - i * 8)) & 255)).join(".");
  return {
    output: `Address:   ${ip}\nNetmask:   ${maskStr} = ${p}\nWildcard:  ${maskStr.split(".").map((b) => 255 - parseInt(b)).join(".")}\n=>\nNetwork:   ${network}/${p}\nBroadcast: ${broadcast}\nHostMin:   ${network.split(".").map((b, i) => i === 3 ? parseInt(b) + 1 : b).join(".")}\nHostMax:   ${broadcast.split(".").map((b, i) => i === 3 ? parseInt(b) - 1 : b).join(".")}\nHosts/Net: ${Math.pow(2, 32 - p) - 2}`,
    cwd: session.cwd,
  };
}

function cmdNumfmt(session, args) {
  const num = parseInt(args.find((a) => !a.startsWith("-")) || "0");
  if (args.includes("--to=si")) {
    if (num >= 1e9) return { output: `${(num / 1e9).toFixed(1)}G`, cwd: session.cwd };
    if (num >= 1e6) return { output: `${(num / 1e6).toFixed(1)}M`, cwd: session.cwd };
    if (num >= 1e3) return { output: `${(num / 1e3).toFixed(1)}K`, cwd: session.cwd };
  }
  return { output: String(num), cwd: session.cwd };
}

function cmdType(session, args) {
  if (!args.length) return { output: "Usage: type name [name ...]", cwd: session.cwd };
  return { output: args.map((a) => `${a} is /usr/bin/${a}`).join("\n"), cwd: session.cwd };
}
function cmdReadelf(session, args) { return { output: "(readelf: ELF binary analysis - simulated)", cwd: session.cwd }; }
function cmdNm(session, args) { return { output: "(nm: symbol table - simulated)", cwd: session.cwd }; }
function cmdStrace(session, args) { return { output: "(strace: system call tracing - simulated)\nexecve() = 0\nbrk() = 0\nmmap() = 0x7f1234567890", cwd: session.cwd }; }
function cmdLtrace(session, args) { return { output: "(ltrace: library call tracing - simulated)", cwd: session.cwd }; }
function cmdLdd(session, args) {
  if (!args.length) return { output: "ldd: missing file operand", cwd: session.cwd };
  return { output: `\tlinux-vdso.so.1 (0x00007ffd12345678)\n\tlibc.so.6 => /usr/lib/libc.so.6 (0x00007f1234567000)\n\t/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f1234789000)`, cwd: session.cwd };
}
function cmdObjdump(session, args) { return { output: "(objdump: object file dump - simulated)", cwd: session.cwd }; }

function cmdGit(session, args) {
  const sub = args[0];
  if (!sub) return { output: "usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]\n           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]\n           [--super-prefix=<path>] [--config-env=<name>=<envvar>]\n           <command> [<args>]", cwd: session.cwd };
  const cmds = {
    init: "Initialized empty Git repository in /home/user/.git/",
    status: "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
    log: "commit a1b2c3d4e5f67890 (HEAD -> main, origin/main)\nAuthor: user <user@archbtw>\nDate:   Mon Jan  1 00:00:00 2024 +0000\n\n    Initial commit\n\ncommit f0e9d8c7b6a54321\nAuthor: user <user@archbtw>\nDate:   Sun Dec 31 23:59:59 2023 +0000\n\n    Add dotfiles",
    "log --oneline": "a1b2c3d Initial commit\nf0e9d8c Add dotfiles",
    branch: "* main\n  development\n  feature/rice",
    diff: "",
    pull: "Already up to date.",
    push: "Everything up-to-date",
    fetch: "",
    clone: `Cloning into '${args[1] || "repo"}'...\nremote: Counting objects: 100% (10/10), done.\nWriting objects: 100% (10/10), 1.23 KiB | 1.23 MiB/s, done.`,
    stash: "Saved working directory and index state WIP on main: a1b2c3d Initial commit",
    "stash pop": "On branch main\nnothing to commit, working tree clean",
    config: sub === "config" && args[1] === "--list" ? "user.name=user\nuser.email=user@archbtw\ncore.editor=vim\ncore.autocrlf=false\nbranch.main.remote=origin" : "",
    add: "",
    commit: `[main a1b2c3d] ${args.slice(args.indexOf("-m") + 1).join(" ") || "commit"}\n 1 file changed, 1 insertion(+)`,
    checkout: args[1] ? `Switched to branch '${args[1]}'` : "error: pathspec '' did not match any file(s) known to git.",
    reset: "HEAD is now at a1b2c3d Initial commit",
    rebase: "Successfully rebased and updated refs/heads/main.",
    merge: "Already up to date.",
    tag: "v1.0\nv1.1\nv2.0",
    remote: "origin",
    show: "commit a1b2c3d4e5f67890\nAuthor: user <user@archbtw>\nDate:   Mon Jan  1 00:00:00 2024 +0000\n\n    Initial commit",
    blame: "(user 2024-01-01) 1 #!/bin/bash\n(user 2024-01-01) 2 echo 'hello world'",
    bisect: "Bisecting: 0 revisions left to test after this (roughly 0 steps)",
    grep: "Searching in git repository (simulated)",
    shortlog: "user (5):\n      Add dotfiles\n      Configure vim\n      Rice terminal\n      Install Arch\n      Initial commit",
  };
  const key = [sub, args[1]].filter(Boolean).join(" ");
  const out = cmds[key] !== undefined ? cmds[key] : cmds[sub] !== undefined ? cmds[sub] : `git: '${sub}' is not a git command. See 'git --help'.`;
  return { output: out, cwd: session.cwd };
}

function cmdMake(session, args) {
  return {
    output: `gcc -Wall -Wextra -O2 -o main main.c\n/usr/bin/ld: (simulated) linking...\n\nBuild complete: main (simulated)`,
    cwd: session.cwd,
  };
}

function cmdGcc(session, args) {
  const files = args.filter((a) => !a.startsWith("-"));
  if (!files.length) return { output: "gcc: fatal error: no input files\ncompilation terminated.", cwd: session.cwd };
  return { output: `gcc: compiling ${files.join(", ")} (simulated)`, cwd: session.cwd };
}

const PYTHON_RESULTS = {
  "import sys; print(sys.version)": "3.12.4 (main, Jun 18 2024, 00:00:00) [GCC 14.1.1 20240507]",
  "print('hello world')": "hello world",
  "print('Hello, World!')": "Hello, World!",
  "1+1": "2",
  "2**10": "1024",
  "import math; print(math.pi)": "3.141592653589793",
  "import os; print(os.getcwd())": "/home/user",
};

function cmdPython(session, args) {
  if (!args.length || args[0] === "-V" || args[0] === "--version") {
    return { output: "Python 3.12.4", cwd: session.cwd };
  }
  if (args[0] === "-c") {
    const code = args.slice(1).join(" ").replace(/^"|"$/g, "");
    const result = PYTHON_RESULTS[code];
    if (result) return { output: result, cwd: session.cwd };
    // Try simple eval
    try {
      const safe = code.replace(/print\((.*)\)/, "$1");
      const val = Function(`"use strict"; return (${safe.replace(/[^0-9+\-*/%.()\s"']/g, "")})`)();
      if (code.startsWith("print(")) return { output: String(val), cwd: session.cwd };
    } catch {}
    return { output: `(Python 3.12.4 - expression evaluated in simulation)`, cwd: session.cwd };
  }
  return {
    output: `Python 3.12.4 (main, Jun 18 2024, 00:00:00) [GCC 14.1.1 20240507]\nType "help", "copyright", "credits" or "license" for more information.\n>>> (interactive REPL - simulated)`,
    cwd: session.cwd,
  };
}

function cmdNode(session, args) {
  if (args[0] === "-v" || args[0] === "--version") return { output: "v20.15.0", cwd: session.cwd };
  if (args[0] === "-e") {
    try {
      const safe = args.slice(1).join(" ").replace(/[^0-9+\-*/%.()\s"';]/g, "");
      const val = Function(`"use strict"; return (${safe})`)();
      return { output: String(val), cwd: session.cwd };
    } catch { return { output: "(Node.js expression - simulated)", cwd: session.cwd }; }
  }
  return { output: `Node.js v20.15.0\nType '.help' for more information.\n> (interactive REPL - simulated)`, cwd: session.cwd };
}

function cmdLua(session, args) { return { output: "Lua 5.4.7 (simulated)\n> (interactive REPL - simulated)", cwd: session.cwd }; }
function cmdRuby(session, args) { return { output: "ruby 3.3.4 (simulated)\nirb(main):001:0> (interactive REPL - simulated)", cwd: session.cwd }; }
function cmdPerl(session, args) { return { output: "perl v5.38.2 (simulated)\n(interactive REPL - simulated)", cwd: session.cwd }; }
function cmdBash(session, args) {
  if (args[0] === "--version") return { output: "GNU bash, version 5.2.26(1)-release (x86_64-pc-linux-gnu)\nCopyright (C) 2022 Free Software Foundation, Inc.", cwd: session.cwd };
  return { output: "bash: spawning subshell (simulated)\nexit with 'exit'", cwd: session.cwd };
}
function cmdZsh(session, args) {
  if (args[0] === "--version") return { output: "zsh 5.9 (x86_64-pc-linux-gnu)", cwd: session.cwd };
  return { output: "zsh: spawning subshell (simulated)\nexit with 'exit'", cwd: session.cwd };
}
function cmdFish(session, args) { return { output: "fish 3.7.1 (simulated)\nWelcome to fish, the friendly interactive shell.\n", cwd: session.cwd }; }
function cmdExit(session, args) { return { output: "logout", cwd: session.cwd, exit: true }; }
function cmdReboot(session, args) { return { output: "Rebooting...\n(Simulated: Terminal will restart)\n\nConnection to archbtw closed.", cwd: session.cwd, reboot: true }; }
function cmdShutdown(session, args) { return { output: "Shutdown scheduled.\nBroadcast message from root:\nThe system will power off now!\n\nConnection to archbtw closed.", cwd: session.cwd, exit: true }; }
function cmdPoweroff(session, args) { return cmdShutdown(session, args); }

function getDate() {
  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[now.getMonth()]} ${String(now.getDate()).padStart(2)} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
}

// ============================================================
//  API ROUTES
// ============================================================

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Arch Linux Terminal API", version: "1.0.0" });
});

// Execute a command
app.post("/cmd", (req, res) => {
  const { session: sessionId, command } = req.body;
  if (!sessionId) return res.status(400).json({ error: "session required" });
  if (typeof command !== "string") return res.status(400).json({ error: "command must be a string" });

  const session = getSession(sessionId);
  const result = processCommand(session, command);

  res.json({
    output: result.output || "",
    cwd: result.cwd || session.cwd,
    clear: result.clear || false,
    exit: result.exit || false,
    reboot: result.reboot || false,
  });
});

// Get current session state (cwd, env, etc.)
app.get("/session/:id", (req, res) => {
  const session = getSession(req.params.id);
  res.json({ cwd: session.cwd, env: session.env, historyLen: session.history.length });
});

// Reset session
app.delete("/session/:id", (req, res) => {
  delete sessions[req.params.id];
  res.json({ ok: true });
});

// Tab completion endpoint
app.post("/complete", (req, res) => {
  const { session: sessionId, partial } = req.body;
  const session = getSession(sessionId);
  const allCommands = ["help","ls","ll","la","cd","pwd","cat","echo","mkdir","rmdir","rm","touch","cp","mv","find","grep","head","tail","wc","sort","uniq","tr","cut","sed","awk","less","more","clear","neofetch","uname","whoami","id","hostname","date","cal","uptime","df","du","free","top","htop","ps","kill","killall","env","export","unset","alias","unalias","history","which","whereis","man","info","pacman","yay","paru","systemctl","journalctl","dmesg","lsblk","lscpu","lsusb","lspci","lsmem","lshw","fdisk","mount","umount","ip","ifconfig","ss","netstat","nmap","curl","wget","ssh","scp","rsync","tar","gzip","gunzip","zip","unzip","chmod","chown","chgrp","stat","file","diff","patch","ln","readlink","basename","dirname","printf","sleep","time","watch","xargs","tee","yes","seq","shuf","rev","fold","expand","unexpand","nl","strings","xxd","od","base64","md5sum","sha256sum","sha512sum","passwd","su","sudo","groups","users","last","w","who","finger","write","wall","bc","dc","factor","expr","true","false","test","vim","vi","nano","emacs","cowsay","cowthink","fortune","figlet","lolcat","toilet","cmatrix","sl","banner","asciiart","weather","joke","riddle","quote","fact","hack","matrix","fire","starwars","tetris","snake","2048","chess","calc","units","ipcalc","numfmt","type","readelf","nm","strace","ltrace","ldd","objdump","git","make","gcc","python","python3","node","lua","ruby","perl","bash","sh","zsh","fish","exit","logout","reboot","shutdown","poweroff","halt"];

  const parts = partial.split(" ");
  let completions = [];

  if (parts.length === 1) {
    // Complete command
    completions = allCommands.filter((c) => c.startsWith(parts[0]));
  } else {
    // Complete file/directory
    const lastPart = parts[parts.length - 1];
    const dir = lastPart.includes("/") ? resolvePath(session.cwd, lastPart.slice(0, lastPart.lastIndexOf("/") + 1)) : session.cwd;
    const prefix = lastPart.includes("/") ? lastPart.slice(lastPart.lastIndexOf("/") + 1) : lastPart;
    completions = Object.keys(session.vfs)
      .filter((p) => {
        const parent = dirname(p);
        return parent === dir && basename(p).startsWith(prefix);
      })
      .map((p) => {
        const name = basename(p);
        return session.vfs[p].type === "dir" ? name + "/" : name;
      });
  }

  res.json({ completions });
});

app.listen(PORT, () => {
  console.log(`Arch Linux Terminal API running on port ${PORT}`);
});
