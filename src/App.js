import React, { Component } from 'react'
import MonacoEditor from 'react-monaco-editor'
import './App.css'

const prefix = 'json-'

const defaultCode = `return json`
const flagNames = ['slow', 'simple']
class App extends Component {
  constructor() {
    super()
    this.state = { ...this.load(), result: '' }
  }

  load() {
    const name = window.location.hash.substr(1) || 'default'
    const fromLocalStorage =
      JSON.parse(window.localStorage.getItem(prefix + name)) || {}
    const names = [...window.localStorage]
      .map((_, i) => localStorage.key(i))
      .filter(n => n.startsWith(prefix))
      .map(n => n.substr(prefix.length))

    const data = {
      code: fromLocalStorage.code || defaultCode,
      json: fromLocalStorage.json || '[]',
      flags:
        fromLocalStorage.flags ||
        flagNames.reduce((p, c) => ({ ...p, [c]: false }), {}),
      name,
      names
    }

    if (!data.slow) {
      data.result = this.run(data)
    }

    return data
  }

  run({ code, json }) {
    try {
      // eslint-disable-next-line
      var transform = new Function('json', code)
      return transform(JSON.parse(json))
    } catch (e) {
      return e.toString()
    }
  }

  async runSlow() {
    //try {
    const result = await this.run(this.state)
    this.setState({ result })
    //} catch (e) {
    //  this.setState({ result: e.toString() });
    //}
  }

  componentDidMount() {
    window.addEventListener('hashchange', e => {
      console.log('hashchange')
      this.setState(this.load())
    })
  }

  delete(name) {
    window.localStorage.removeItem(prefix + name)
    this.setState(this.load())
  }

  render() {
    const { name, names, code, json, flags, result } = this.state

    const onMonacoChange = section => newValue => {
      const data = {
        code,
        json,
        flags
      }
      data[section] = newValue
      window.localStorage.setItem(prefix + name, JSON.stringify(data))
      this.setState(this.load())
    }

    const onChange = section => e => {
      const data = {
        code,
        json,
        flags
      }
      data[section] = e.target.value
      window.localStorage.setItem(prefix + name, JSON.stringify(data))
      this.setState(this.load())
    }

    const onCheckedFlag = flagName => e => {
      console.log('e.target.checked, section:', e.target.checked, flagName)
      const data = {
        code,
        json,
        flags
      }
      data['flags'][flagName] = e.target.checked
      window.localStorage.setItem(prefix + name, JSON.stringify(data))
      this.setState(this.load())
    }

    const options = {
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      automaticLayout: false
    }

    return (
      <div className="App">
        <main>
          <header>
            {names.map(n => (
              <span key={n}>
                [<a href={`#${n}`}>{n}</a>{' '}
                <button onClick={() => this.delete(n)}>
                  <span role="img" aria-label={`delete ${name}`}>
                    ❌
                  </span>
                </button>
                ]{' '}
              </span>
            ))}
          </header>
          <h1>{name}</h1>
          <div className="leftBar">
            {flagNames.map(name => (
              <span>
                <label>
                  {name}
                  <input
                    type="checkbox"
                    checked={flags[name]}
                    onChange={onCheckedFlag(name)}
                  />
                </label>{' '}
              </span>
            ))}
          </div>
          <div className="rightBar">
            {flags.slow && <button onClick={() => this.runSlow()}>Run</button>}
          </div>

          <div className="code">
            <fieldset>
              <legend>Code</legend>
              {flags.simple ? (
                <textarea value={code} onChange={onChange('code')} />
              ) : (
                <MonacoEditor
                  height="200"
                  language="javascript"
                  value={code}
                  options={options}
                  onChange={onMonacoChange('code')}
                />
              )}
            </fieldset>
          </div>

          <div>
            <fieldset>
              <legend>JSON</legend>
              {flags.simple ? (
                <textarea value={json} onChange={onChange('json')} />
              ) : (
                <MonacoEditor
                  height="500"
                  language="json"
                  value={json}
                  options={options}
                  onChange={onMonacoChange('json')}
                />
              )}
            </fieldset>
          </div>
          <div>
            <fieldset>
              <legend>Result</legend>
              <pre className="Preview">
                {flags.simple ? (
                  JSON.stringify(result, null, '  ')
                ) : (
                  <MonacoEditor
                    height="500"
                    language="json"
                    value={JSON.stringify(result, null, '  ')}
                    options={{ ...options, readOnly: true }}
                  />
                )}
              </pre>
            </fieldset>
          </div>
        </main>
      </div>
    )
  }
}

export default App
