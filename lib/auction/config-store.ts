import { defaultAuctionConfig, type AuctionAdminConfig } from "@/components/auction/types";
const prefix="vantage-auction-config:";
export function loadAuctionConfig(productId:string):AuctionAdminConfig{if(typeof window==="undefined")return{...defaultAuctionConfig};try{return{...defaultAuctionConfig,...JSON.parse(window.localStorage.getItem(`${prefix}${productId}`)??"{}")};}catch{return{...defaultAuctionConfig};}}
export function saveAuctionConfig(productId:string,config:AuctionAdminConfig){if(typeof window!=="undefined")window.localStorage.setItem(`${prefix}${productId}`,JSON.stringify(config));}
export function removeAuctionConfig(productId:string){if(typeof window!=="undefined")window.localStorage.removeItem(`${prefix}${productId}`);}
