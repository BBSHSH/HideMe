// import { useState } from "react";
// import { NavLink } from "react-router-dom";
// import Icon from "./Icon";
// import { C, glassPanel } from "../theme/tokens";
// import { NAV_ITEMS } from "../data/nav";

// export type SidebarProps = {
//   onNewProject?: () => void;
// };

// export default function Sidebar({
//   onNewProject,
// }: SidebarProps) {
//   const [expanded, setExpanded] = useState(false);

//   return (
//     <aside
//       onMouseEnter={() => setExpanded(true)}
//       onMouseLeave={() => setExpanded(false)}
//       style={{
//         position: "fixed",
//         left: 0,
//         top: 72,
//         bottom: 0,

//         width: expanded ? 260 : 88,

//         display: "flex",
//         flexDirection: "column",

//         padding: 16,
//         gap: 8,

//         ...glassPanel,

//         borderRight: `1px solid rgba(88,101,242,0.15)`,

//         zIndex: 40,

//         transition:
//           "width 280ms cubic-bezier(0.22,1,0.36,1)",

//         overflow: "hidden",
//       }}
//     >
//       {/* Logo */}

//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 12,

//           padding: 8,
//           minHeight: 56,
//           marginBottom: 24,
//         }}
//       >
//         <div
//           style={{
//             width: 40,
//             height: 40,

//             minWidth: 40,

//             borderRadius: 12,

//             background: C.primaryContainer,

//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",

//             boxShadow:
//               "0 0 20px rgba(88,101,242,0.35)",

//             transition:
//               "transform 220ms ease",

//             transform: expanded
//               ? "scale(1.05)"
//               : "scale(1)",
//           }}
//         >
//           <Icon
//             name="shield"
//             filled
//             style={{
//               color: "#fff",
//             }}
//           />
//         </div>

//         <div
//           style={{
//             whiteSpace: "nowrap",

//             opacity: expanded ? 1 : 0,

//             transform: expanded
//               ? "translateX(0)"
//               : "translateX(-12px)",

//             transition:
//               "all 220ms ease",
//           }}
//         >
//           <h1
//             style={{
//               margin: 0,

//               fontSize: 18,
//               fontWeight: 900,

//               color: C.primary,

//               letterSpacing: "0.2em",

//               textTransform: "uppercase",
//             }}
//           >
//             HideMe
//           </h1>

//           <p
//             style={{
//               margin: 0,

//               fontSize: 10,

//               color: C.outline,

//               fontWeight: 700,

//               letterSpacing: "0.1em",

//               textTransform: "uppercase",
//             }}
//           >
//             Secure Perimeter
//           </p>
//         </div>
//       </div>

//       {/* Navigation */}

//       <nav
//         style={{
//           flex: 1,

//           display: "flex",
//           flexDirection: "column",

//           gap: 4,
//         }}
//       >
//         {NAV_ITEMS.map((item) => (
//           <NavLink
//             key={item.id}
//             to={item.path}
//             end={item.path === "/"}
//             style={({ isActive }) => ({
//               display: "flex",

//               alignItems: "center",

//               gap: 16,

//               padding: "14px 16px",

//               borderRadius: 14,

//               textDecoration: "none",

//               overflow: "hidden",

//               color: isActive
//                 ? C.primary
//                 : C.onSurfaceVariant,

//               background: isActive
//                 ? "rgba(88,101,242,0.14)"
//                 : "transparent",

//               transition:
//                 "all 180ms ease",
//             })}
//           >
//             {({ isActive }) => (
//               <>
//                 <Icon
//                   name={item.icon}
//                   filled={isActive}
//                   style={{
//                     minWidth: 24,

//                     transform: expanded
//                       ? "scale(1.15)"
//                       : "scale(1)",

//                     transition:
//                       "transform 220ms ease",
//                   }}
//                 />

//                 <span
//                   style={{
//                     whiteSpace: "nowrap",

//                     fontWeight: 700,

//                     opacity: expanded ? 1 : 0,

//                     transform: expanded
//                       ? "translateX(0)"
//                       : "translateX(-10px)",

//                     transition:
//                       "all 220ms ease",
//                   }}
//                 >
//                   {item.label}
//                 </span>
//               </>
//             )}
//           </NavLink>
//         ))}
//       </nav>

//       {/* Button */}

//       <button
//         onClick={onNewProject}
//         style={{
//           height: 52,

//           border: "none",

//           borderRadius: 14,

//           background: C.primaryContainer,

//           color: "#fff",

//           cursor: "pointer",

//           display: "flex",

//           alignItems: "center",

//           justifyContent: expanded
//             ? "flex-start"
//             : "center",

//           gap: 12,

//           padding: expanded
//             ? "0 16px"
//             : 0,

//           overflow: "hidden",

//           transition:
//             "all 220ms ease",
//         }}
//       >
//         <Icon
//           name="add"
//           filled
//         />

//         <span
//           style={{
//             whiteSpace: "nowrap",

//             width: expanded
//               ? "auto"
//               : 0,

//             opacity: expanded
//               ? 1
//               : 0,

//             overflow: "hidden",

//             transition:
//               "all 220ms ease",

//             fontWeight: 700,
//           }}
//         >
//           New Project
//         </span>
//       </button>
//     </aside>
//   );
// }