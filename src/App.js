import React, { Component } from 'react'
import './App.css'

const prefix = 'json-'

const defaultCode = `return json.map(item => {
  return {...item};
})`

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
      slow: Boolean(fromLocalStorage.slow),
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
    const { name, names, code, json, slow, result } = this.state

    const onChange = section => e => {
      const data = {
        code,
        json,
        slow
      }
      data[section] = e.target.value
      window.localStorage.setItem(prefix + name, JSON.stringify(data))
      this.setState(this.load())
    }

    const onChecked = section => e => {
      console.log('e.target.checked, section:', e.target.checked, section)
      const data = {
        code,
        json,
        slow
      }
      data[section] = e.target.checked
      window.localStorage.setItem(prefix + name, JSON.stringify(data))
      this.setState(this.load())
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
            Slow
            <input
              type="checkbox"
              checked={slow}
              onChange={onChecked('slow')}
            />
          </div>
          <div className="rightBar">
            {slow && <button onClick={() => this.runSlow()}>Run</button>}
          </div>

          <div className="code">
            <fieldset>
              <legend>Code</legend>
              <textarea value={code} onChange={onChange('code')} />
            </fieldset>
          </div>

          <div>
            <fieldset>
              <legend>JSON</legend>
              <textarea value={json} onChange={onChange('json')} />
            </fieldset>
          </div>
          <div>
            <fieldset>
              <legend>Result</legend>
              <pre className="Preview">
                {JSON.stringify(result, null, '  ')}
              </pre>
            </fieldset>
          </div>
        </main>
      </div>
    )
  }
}

export default App
