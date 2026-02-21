import{c as i,y as a,z as o,E as u,G as t}from"./index-BsxJzoo8.js";/**
 * @license lucide-react v0.474.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],m=i("CircleAlert",c);function f(e){const n=a();return o({mutationFn:()=>t.post(`/v1/intervenciones/${e}/informes`),onSuccess:()=>{n.invalidateQueries({queryKey:["intervenciones",e]})}})}function l(e){return u({queryKey:["informes",e],queryFn:async()=>{const{data:n}=await t.get(`/v1/informes/${e}`);return n},enabled:!!e})}function v(e,n){const s=a();return o({mutationFn:r=>t.patch(`/v1/componentes-informe/${e}/datos`,{datos:r}),onSuccess:()=>{s.invalidateQueries({queryKey:["informes",n]})}})}function q(e,n){const s=a();return o({mutationFn:r=>t.patch(`/v1/informes/${e}/estado`,{estado:r}),onSuccess:()=>{s.invalidateQueries({queryKey:["informes",e]}),s.invalidateQueries({queryKey:["intervenciones",n]})}})}export{m as C,l as a,v as b,q as c,f as u};
