#!/bin/bash
nohup ssh -o ServerAliveInterval=60 -R 80:localhost:8090 nokey@localhost.run > tunnel.log 2>&1 &

sleep 5

cat tunnel.log

