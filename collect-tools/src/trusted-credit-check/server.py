#!/usr/local/bin/env python3

# Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import argparse
import socket
import sys

SECRET_BANK_ACCOUNT_BALANCE = 1500


SERVER_PORT = 5005
SERVER_CONN_BACKLOG = 128


RES_NO = "0"
RES_YES = "1"
RES_ERR = "2"

def credit_check(amount):
    # Check if balance COVERS the amount (not if amount exceeds balance)
    res = RES_YES if SECRET_BANK_ACCOUNT_BALANCE >= amount else RES_NO
    return res

class VsockListener:
    """Server"""
    def __init__(self, conn_backlog=128):
        self.conn_backlog = conn_backlog

    def bind(self, port):
        """Bind and listen for connections on the specified port"""
        self.sock = socket.socket(socket.AF_VSOCK, socket.SOCK_STREAM)
        self.sock.bind((socket.VMADDR_CID_ANY, port))
        self.sock.listen(self.conn_backlog)

    def recv_data(self):
        """Receive data from a remote endpoint"""
        while True:
            try:
                (from_client, (remote_cid, remote_port)) = self.sock.accept()
                # Read 1024 bytes at a time
                while True:
                    data = from_client.recv(1024).decode()
                    if not data:
                        break
                    res = credit_check(int(data.strip()))
                    print(f"{data} -> {res}", end='', flush=True)
                    # Send on CLIENT socket, not listening socket
                    from_client.sendall(res.encode())
                    print()
                    from_client.close()
                    break  # Exit loop after processing one request

            except socket.error as e:
                print(f"Socket error: {e}")
            except Exception as e:
                print(f"Error: {e}")

    def send_data(self, data):
        """Send data to a renote endpoint"""
        while True:
            (to_client, (remote_cid, remote_port)) = self.sock.accept()
            to_client.sendall(data)
            to_client.close()


def server_handler(args):
    server = VsockListener()
    server.bind(args.port)
    server.recv_data()


def main():
    parser = argparse.ArgumentParser(prog='vsock-sample')
    parser.add_argument("--version", action="version",
                        help="Prints version information.",
                        version='%(prog)s 0.1.0')
    subparsers = parser.add_subparsers(title="options")

    server_parser = subparsers.add_parser("server", description="Server",
                                          help="Listen on a given port.")
    server_parser.add_argument("port", type=int, help="The local port to listen on.")
    server_parser.set_defaults(func=server_handler)

    if len(sys.argv) < 2:
        parser.print_usage()
        sys.exit(1)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()