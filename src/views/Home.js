/* eslint-disable no-param-reassign */
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import prettier from 'prettier/standalone'
import parserBabel from 'prettier/parser-babel'
import parserHtml from 'prettier/parser-html'
import parserpostCss from 'prettier/parser-postcss'

import env from '../../.env'

const api = axios.create({
   baseURL: 'https://api.figma.com/v1',
   timeout: 10000,
   headers: { 'X-FIGMA-TOKEN': env.PERSONAL_TOKEN }
})

// background: Array(1)
// 0:
// blendMode: "NORMAL"
// color:
// a: 1
// b: 1
// g: 1
// r: 1
// backgroundColor: {r: 1, g: 1, b: 1, a: 1}
// blendMode: "PASS_THROUGH"
// children: (2) [{…}, {…}]
// clipsContent: true
// constraints: {vertical: "TOP", horizontal: "LEFT"}
// cornerRadius: 20
// effects: [{…}]
// fills: [{…}]
// id: "1:3"
// itemSpacing: 16
// layoutGrids: []
// layoutMode: "VERTICAL"
// name: "Card"
// paddingBottom: 20
// paddingLeft: 30
// paddingRight: 30
// paddingTop: 20
// primaryAxisSizingMode: "FIXED"
// rectangleCornerRadii: Array(4)
// 0: 20
// 1: 20
// 2: 20
// 3: 20
// length: 4
// __proto__: Array(0)
// strokeAlign: "INSIDE"
// strokeWeight: 1
// strokes: []

const dictionary = {
   background: ({ prop }) => prop.length && `background: rgba(${prop[0].color.r}, ${prop[0].color.g}, ${prop[0].color.b}, ${prop[0].color.a});`,
   rectangleCornerRadii: ({ prop: [tl, tr, br, bl] }) => `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`,
   paddingBottom: ({ prop }) => `padding-bottom: ${prop}px;`,
   paddingLeft: ({ whole }) => `padding: ${whole.paddingTop}px ${whole.paddingRight}px ${whole.paddingBottom}px ${whole.paddingLeft}px;`,
   paddingRight: ({ prop }) => `padding-right: ${prop}px;`,
   paddingTop: ({ prop }) => `padding-top: ${prop}px;`,
   layoutMode: ({ prop }) => `flex-direction: ${prop === 'HORIZONTAL' ? 'row' : 'column'};`,
   layoutGrow: ({ prop }) => `flex-grow: ${prop};`
}

const Home = () => {
   const [token, setToken] = useState(env.PERSONAL_TOKEN || '')
   const [fileId, setFileId] = useState(env.FILE_ID || '')
   const [file, setFile] = useState(null)
   const [componentsCode, setComponentsCode] = useState([])

   const setInput = (func) => (e) => func(e.target.value)

   const getFile = async () => {
      console.log('hey')
      const { data } = await api.get(`files/${fileId}`)
      console.log(data)
      setFile(data)
   }

   const handleFile = async () => {
      const oestePage = file.document.children.find((el) => el.name === 'Oeste')
      const componentsFrame = oestePage.children.find((el) => el.name === 'Components')
      const { children: components } = componentsFrame

      const newComponentsCode = []

      const generateSComponent = (el) => `
         const ${el.name} = styled.div\`
         display: flex;${Object.entries(el).reduce(
            (prev, [key, value]) =>
               dictionary[key] && dictionary[key]({ prop: value, whole: el }) ? `   ${prev}${dictionary[key]({ prop: value, whole: el })}\n` : prev,
            ''
         )}
      \`;\n`

      const generateSComponents = (component, el) => {
         component.string += generateSComponent(el)
         if (el.children) el.children.forEach((child) => generateSComponents(component, child))
      }

      components.forEach((el) => {
         const component = { string: '' }
         generateSComponents(component, el)
         newComponentsCode.push(component.string)
      })
      setComponentsCode(newComponentsCode)
      console.log(newComponentsCode)
   }

   useEffect(() => {
      axios.interceptors.request.use((config) => {
         config.headers['X-FIGMA-TOKEN'] = token
         return config
      })
   }, [token])

   useEffect(() => {
      if (!file) return
      handleFile(file)
   }, [file])

   return (
      <div>
         <div>
            Token: <input type="text" value={token} onChange={setInput(setToken)} />
         </div>
         <div>
            File ID: <input type="text" value={fileId} onChange={setInput(setFileId)} />
         </div>
         <button onClick={getFile} type="button">
            GO!
         </button>
         <div>
            Code
            {!!componentsCode.length &&
               componentsCode.map((el, i) => (
                  <SyntaxHighlighter key={i} language="javascript" style={docco}>
                     {prettier.format(`import styled from 'styled'; import react from 'react';\n${el}`, {
                        plugins: [
                           parserBabel,
                           parserHtml,
                           parserpostCss,
                        ],
                        parser: 'babel',
                        arrowParens: 'always',
                        bracketSpacing: true,
                        embeddedLanguageFormatting: 'auto',
                        htmlWhitespaceSensitivity: 'css',
                        insertPragma: false,
                        jsxBracketSameLine: false,
                        jsxSingleQuote: false,
                        printWidth: 80,
                        proseWrap: 'preserve',
                        quoteProps: 'as-needed',
                        requirePragma: false,
                        semi: true,
                        singleQuote: true,
                        tabWidth: 2,
                        trailingComma: 'es5',
                        useTabs: false,
                        vueIndentScriptAndStyle: false
                     })}
                  </SyntaxHighlighter>
               ))}
         </div>
      </div>
   )
}

export default Home
