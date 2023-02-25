import React, { Component, Fragment } from 'react'
import MonacoEditor from 'react-monaco-editor'
import './App.css'

const prefix = 'json-'

const defaultCode = `return json`
const flagNames = ['slow', 'simple']
class App extends Component {
  constructor() {
    super()
    this.state = { loggedIn: false, result: '', ...this.load() }
  }

  load() {
    const name = window.location.hash.substr(1) || 'default'
    const localStorageValue = JSON.parse(
      window.localStorage.getItem(prefix + name)
    )

    const fromLocalStorage = localStorageValue || {}
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
      gist: fromLocalStorage.gist,
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
      const res = transform(JSON.parse(json))
      return res
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

  async loadFromGist() {
    const { code, json, gist } = this.state
    const r = await fetch(`https://api.github.com/gists/${gist}`)
    const changes = {}
    if (r.ok) {
      const { files } = await r.json()
      if (files['code.js']) {
        changes.code = files['code.js'].content
      }
      if (files['data.json']) {
        changes.json = files['data.json'].content
      }

      console.log('changes:', changes)
      if (
        (changes.code && changes.code !== code) ||
        (changes.json && changes.json !== json)
      ) {
        if (
          window.confirm('This will overwrite local changes.\nAre you sure?')
        ) {
          this.setState(changes)
        }
      }
    }
  }

  async saveToGist() {
    const { code, json, gist } = this.state

    const files = {}
    files['code.js'] = { content: code }
    files['data.json'] = { content: json }

    const r = await fetch(
      `https://api-github-com.auth.codeite.net/gists/${gist}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Update', files }),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    )

    if (r.ok) {
      alert('saved')
    } else {
      alert('not saved')
    }
  }

  render() {
    const {
      name,
      names,
      code,
      json,
      flags,
      gist,
      result,
      loggedIn
    } = this.state

    const onMonacoChange = section => newValue => {
      const data = {
        code,
        json,
        flags,
        gist
      }
      data[section] = newValue
      window.localStorage.setItem(prefix + name, JSON.stringify(data))
      this.setState(this.load())
    }

    const onChange = section => e => {
      const data = {
        code,
        json,
        flags,
        gist
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
        flags,
        gist
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
              <span key={name}>
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
            <label>
              Gist:
              <input
                type="url"
                size={100}
                value={gist}
                onChange={onChange('gist')}
              />
            </label>
            <button onClick={() => this.loadFromGist()}>Load</button>
            {loggedIn && (
              <Fragment>
                |-----|
                <button onClick={() => this.saveToGist()}>Save</button>
                |-----|
                <button onClick={() => this.createGist()}>Create</button>
              </Fragment>
            )}
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
