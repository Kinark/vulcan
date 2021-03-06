/* eslint-disable no-param-reassign */
import React, { useState, useEffect, useRef } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import axios from 'axios'
import prettier from 'prettier/standalone'
import parserBabel from 'prettier/parser-babel'
import parserHtml from 'prettier/parser-html'
import parserpostCss from 'prettier/parser-postcss'
import camelCase from 'camelcase'
import styled from 'styled-components'
import FigmaEmbed from 'react-figma-embed'
import urlencode from 'urlencode'
import { Collapse } from 'react-collapse'
import copy from 'copy-to-clipboard'
import ReactTooltip from 'react-tooltip'

import fileIdHint from './fileIdHint.png'

// import env from '../../.env'

const api = axios.create({
   baseURL: 'https://api.figma.com/v1',
   timeout: 10000
   // headers: { 'X-FIGMA-TOKEN': env.PERSONAL_TOKEN }
})

const makeTag = (el) => {
   if (el.fills.find((fill) => fill.type === 'IMAGE')) return 'img'
   return 'div'
}

const dictionary = {
   itemSpacing: ({ prop, whole }) =>
      `& > * { margin: ${
         whole.layoutMode === 'HORIZONTAL' ? `0 ${prop / 2}px` : `${prop / 2}px 0`
      } } & > *:first-child { margin-left: 0; margin-top: 0;} & > *:last-child { margin-right: 0; margin-bottom: 0;}`,
   counterAxisAlignItems: ({ prop }) => `align-items: ${prop.toLowerCase()}`,
   style: ({ prop }) =>
      `font-family: ${prop.fontFamily}; font-size: ${prop.fontSize}px; font-weight: ${prop.fontWeight}; line-height: ${
         prop.lineHeightPercent
      }%; letter-spacing: ${prop.letterSpacing}px; text-align: ${prop.textAlignHorizontal.toLowerCase()};`,
   absoluteBoundingBox: ({ prop, whole }) => makeTag(whole) === 'img' && `height: ${prop.height}px; width: ${prop.width}px; object-fit: cover;`,
   type: ({ prop }) => prop === 'ELLIPSE' && 'border-radius: 50%;',
   fills: ({ prop, whole }) =>
      prop.length &&
      `${whole.type === 'TEXT' ? 'color' : 'background'}: rgba(${(prop[0].color.r * 255).toFixed(0)}, ${(prop[0].color.g * 255).toFixed(0)}, ${(
         prop[0].color.b * 255
      ).toFixed(0)}, ${prop[0].opacity || prop[0].color.a});`,
   rectangleCornerRadii: ({ prop: [tl, tr, br, bl] }) => `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`,
   paddingBottom: ({ prop }) => `padding-bottom: ${prop}px;`,
   paddingLeft: ({ whole }) => `padding: ${whole.paddingTop}px ${whole.paddingRight}px ${whole.paddingBottom}px ${whole.paddingLeft}px;`,
   paddingRight: ({ prop }) => `padding-right: ${prop}px;`,
   paddingTop: ({ prop }) => `padding-top: ${prop}px;`,
   layoutMode: ({ prop }) => `flex-direction: ${prop === 'HORIZONTAL' ? 'row' : 'column'};`,
   layoutGrow: ({ prop }) => `flex-grow: ${prop};`,
   effects: ({ prop }) =>
      prop.length &&
      `box-shadow: ${prop[0].offset.x}px ${prop[0].offset.y}px ${prop[0].radius}px 0px rgba(${prop[0].color.r},${prop[0].color.g},${prop[0].color.b},${Number(
         prop[0].color.a
      ).toFixed(2)});`
}

const prettierConfig = {
   plugins: [parserBabel, parserHtml, parserpostCss],
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
}

const Home = () => {
   const [loading, setLoading] = useState(false)
   const [token, setToken] = useState('')
   const [fileId, setFileId] = useState('')
   const [file, setFile] = useState(null)
   const [componentsCode, setComponentsCode] = useState([])
   const currentInterceptor = useRef(null)

   const setInput = (func) => (e) => func(e.target.value)

   const getFile = async (e) => {
      e.preventDefault()
      setLoading(true)
      const { data } = await api.get(`files/${fileId}`)
      setFile(data)
      setLoading(false)
   }

   const handleFile = async () => {
      const { children: components } = file.document.children.find((el) => el.name === 'Oeste')

      const newComponentsCode = []

      const generateSComponent = (el) => `
         const Styled${el.name} = styled.${makeTag(el)}\`
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

      const generateRComponents = (component, el, name) => {
         const openTags = []
         const generateRHeader = (currEl) => {
            if (currEl.children && currEl.children.length) return currEl.children.forEach(generateRHeader)
            component.string += `${camelCase(currEl.name)}Data${currEl.characters ? ` = '${currEl.characters}'` : ''}, `
         }
         const generateRComponent = (currEl) => {
            component.string += makeTag(currEl) === 'img' ? `<Styled${currEl.name} src={${camelCase(currEl.name)}Data} />` : `<Styled${currEl.name}>`
            if (!currEl.children || !currEl.children.length) {
               if (makeTag(currEl) !== 'img') component.string += `{${camelCase(currEl.name)}Data}</Styled${currEl.name}>`
            } else {
               openTags.unshift(currEl.name)
               currEl.children.forEach(generateRComponent)
               component.string += `</Styled${currEl.name}>`
               // openTags.shift()
            }
         }
         component.string += `import styled from 'styled'; import react from 'react';\n\nconst ${name} = ({`
         generateRHeader(el)
         component.string = component.string.substring(0, component.string.length - 2)
         component.string += '}) => ('
         generateRComponent(el)
         // openTags.forEach((tag) => (component.string += `</Styled${tag}>`))
         component.string += ')\n'
      }

      components.forEach((elFrame) => {
         const el = elFrame.children[0]
         const component = { string: '' }
         generateRComponents(component, el, elFrame.name)
         generateSComponents(component, el)
         newComponentsCode.push({ name: elFrame.name, id: elFrame.id, code: component.string })
      })
      setComponentsCode(newComponentsCode)
      console.log(newComponentsCode)
   }

   useEffect(() => {
      if (!token) return
      if (currentInterceptor.current) api.interceptors.request.eject(currentInterceptor.current)
      currentInterceptor.current = api.interceptors.request.use((config) => {
         console.log('token')
         console.log(token)
         config.headers['X-FIGMA-TOKEN'] = token
         return config
      })
   }, [token])

   useEffect(() => {
      if (!file) return
      handleFile(file)
   }, [file])

   return (
      <Wrapper>
         <StyledTooltip html clickable delayHide={1000} type="light" place="right" effect="solid" />
         <Logo>Vulcan</Logo>
         <Description>
            Need to transform your figma auto-layouted components in React/Styled-components code?
            <br />
            Vulcan can help.
         </Description>
         <Tutorial>
            <Steps>
               <h3>Just follow the steps</h3>
               <ul>
                  <li>Make a page called "Oeste".</li>
                  <li>Create an artbord for each component (it's name will be the React component name).</li>
                  <li>Drop your actual components inside each frame.</li>
                  <li>Let Vulcan do the work.</li>
               </ul>
               <small>Tip: hover the inputs to get hints.</small>
            </Steps>
         </Tutorial>
         <form autoComplete="off" onSubmit={getFile}>
            <input autoComplete="off" type="hidden" />
            <Input data-tip="<a href='https://www.figma.com/developers/api#access-tokens'>Get API Token.</a>">
               <label htmlFor="token">Token</label>
               <input id="token" type="text" value={token} onChange={setInput(setToken)} />
            </Input>
            <Input data-place="right" data-tip={`<img style="border-radius: 5px;" src=${fileIdHint} width="350" />`}>
               <label htmlFor="fileId">File ID:</label>
               <input id="fileId" type="text" value={fileId} onChange={setInput(setFileId)} />
            </Input>
            <Button $loading={loading} type="submit">
               {loading ? 'Vulcan is working...' : 'I CALL YOU, VULCAN!'}
            </Button>
         </form>
         <Components>
            {!!componentsCode.length &&
               componentsCode.map(({ name, id, code }) => (
                  <Component key={id}>
                     <Code code={code} fileId={fileId} id={id} name={name} />
                  </Component>
               ))}
         </Components>
         <div>
            Made with <Heart>&#9829;</Heart> by{' '}
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/Kinark">
               Kinark
            </a>
         </div>
      </Wrapper>
   )
}

export default Home

const Code = ({ code, name, fileId, id }) => {
   const [showing, setShowing] = useState(false)
   const [collapsed, setCollapsed] = useState(false)
   const formattedCode = prettier.format(code, prettierConfig)
   return (
      <div>
         <ComponentTitleBar>
            <h2>{name}</h2>
            <Button onClick={() => setCollapsed((prev) => !prev)}>{collapsed ? 'Hide component' : 'Show component'}</Button>
         </ComponentTitleBar>
         <Collapse isOpened={collapsed}>
            <ComponentContent>
               <FigmaEmbed url={`https://www.figma.com/proto/${fileId}?node-id=${urlencode(id)}`} />
               <Button onClick={() => setShowing((prev) => !prev)}>{showing ? 'Hide code' : 'Show code'}</Button>
               <Button onClick={() => copy(formattedCode)}>Copy code</Button>
               <Collapse isOpened={showing}>
                  <SyntaxHighlighter language="javascript" style={docco}>
                     {formattedCode}
                  </SyntaxHighlighter>
               </Collapse>
            </ComponentContent>
         </Collapse>
      </div>
   )
}

const ComponentContent = styled.div`
   padding-top: 1rem;
`

const ComponentTitleBar = styled.div`
   display: flex;
   justify-content: space-between;
   align-items: center;
   h2 {
      margin: 0;
   }
`

const Heart = styled.span`
   color: #e25555;
`

const Components = styled.div`
   margin: 2rem 0;
`

const StyledTooltip = styled(ReactTooltip)`
   box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
   border-radius: 5px !important;
`

const Tutorial = styled.div`
   position: fixed;
   box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
   border-radius: 20px;
   padding: 10px 20px;
   width: 300px;
   bottom: 20px;
   left: 20px;
   opacity: 0.25;
   transition: opacity 150ms;
   z-index: -1;
   &:hover {
      opacity: 1;
   }
`

const Logo = styled.h1`
   margin-bottom: 10px;
`

const Component = styled.div`
   display: flex;
   flex-direction: column;
   text-align: left;
   padding: 15px 25px;
   border-radius: 10px;
   border: solid 2px black;
   background: white;
   h2 {
      margin-top: 0;
   }
   iframe {
      width: 100%;
      border-radius: 10px;
      margin-bottom: 10px;
      border: none;
   }
   pre {
      height: 300px;
   }
`

const Description = styled.p`
   color: #424242;
   margin: 0 0 30px 0;
`

const Steps = styled.div`
   text-align: left;
   h3 {
      margin-bottom: 5px;
   }
   ul {
      color: #424242;
      margin-top: 0;
      padding-left: 20px;
   }
`

const Wrapper = styled.div`
   text-align: center;
   width: 95%;
   max-width: 960px;
   margin: 2rem auto 0;
`

const Input = styled.label`
   display: flex;
   margin: 5px auto;
   flex-direction: row;
   width: 450px;
   height: 40px;
   label {
      font-size: 14px;
      text-transform: uppercase;
      width: 70px;
      border-radius: 5px 0 0 5px;
      background: black;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
   }
   input {
      text-align: center;
      padding: 0 10px;
      border-radius: 0 5px 5px 0;
      flex-grow: 1;
      border: solix 1px black;
   }
`

const Button = styled.button`
   display: inline-block;
   background: ${({ $loading }) => ($loading ? 'gray' : 'blueviolet')};
   pointer-events: ${({ $loading }) => ($loading ? 'none' : 'all')};
   cursor: ${({ $loading }) => ($loading ? 'default' : 'pointer')};
   color: white;
   padding: 10px 20px;
   text-align: center;
   font-weight: 700;
   border-radius: 5px;
   margin: 5px;
   border: none;
`
