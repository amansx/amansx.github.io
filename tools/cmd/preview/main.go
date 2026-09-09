package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"
)

const defaultURL = "http://127.0.0.1:8080/"

func main() {
	config := flag.String("config", "Caddyfile", "path to the Caddy configuration")
	noOpen := flag.Bool("no-open", false, "start the server without opening a browser")
	flag.Parse()

	if ready(defaultURL) {
		fmt.Printf("Anixir is already running at %s\n", defaultURL)
		if !*noOpen {
			openBrowser(defaultURL)
		}
		return
	}

	caddy := exec.Command("go", "tool", "caddy", "run", "--config", *config)
	caddy.Stdin = os.Stdin
	caddy.Stdout = os.Stdout
	caddy.Stderr = os.Stderr

	if err := caddy.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "start Caddy: %v\n", err)
		os.Exit(1)
	}

	go waitAndOpen(!*noOpen)

	if err := caddy.Wait(); err != nil {
		if exit, ok := err.(*exec.ExitError); ok {
			os.Exit(exit.ExitCode())
		}
		fmt.Fprintf(os.Stderr, "Caddy stopped: %v\n", err)
		os.Exit(1)
	}
}

func waitAndOpen(shouldOpen bool) {
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		if ready(defaultURL) {
			fmt.Printf("\nAnixir is ready at %s\n", defaultURL)
			if shouldOpen {
				openBrowser(defaultURL)
			}
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
	fmt.Fprintf(os.Stderr, "\nCaddy started, but %s did not respond within 10 seconds.\n", defaultURL)
}

func ready(url string) bool {
	client := http.Client{Timeout: 300 * time.Millisecond}
	response, err := client.Get(url)
	if err != nil {
		return false
	}
	response.Body.Close()
	return response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusInternalServerError
}

func openBrowser(url string) {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		command = exec.Command("open", url)
	case "windows":
		command = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		command = exec.Command("xdg-open", url)
	}

	if err := command.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "open %s in a browser: %v\n", url, err)
	}
}
