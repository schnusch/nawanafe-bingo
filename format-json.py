#!/usr/bin/env python3
import json
import os
import re
from tempfile import NamedTemporaryFile


class format:
    _string_tokens = re.compile(rb'(?P<end>")|\\.|[^\\"]+')
    _tokens = re.compile(
        rb"|".join(
            map(
                rb"(?P<%s>%s)".__mod__,
                [
                    (b"white", rb"[ \t\n\r]+"),
                    (b"open", rb"\{|\["),
                    (b"close", rb"\}|\]"),
                    (b"quote", rb'"'),
                    (b"comma", rb","),
                    (b"colon", rb":"),
                    (b"eof", rb"$"),
                    (b"other", rb"."),
                ],
            )
        )
    )

    @staticmethod
    def _get_token(m):
        assert m is not None
        for k, v in m.groupdict().items():
            if v is not None:
                return (k, v)
        raise ValueError

    def __init__(self, fileobj, data, *, value_indent=2):
        self._fileobj = fileobj
        self._data = data
        self._off = 0
        self._value_indent = value_indent

        self._indents = [-2]
        self._is_empty = False
        self._was_colon = False

        while True:
            m = self._consume(self._tokens)
            type, value = self._get_token(m)
            self._off = m.end()

            if type == "eof":
                break
            elif type != "white":
                getattr(self, f"_tok_{type}")(value)
                self._is_empty = type == "open"
                self._was_colon = type == "colon"

        self._fileobj.write(b"\n")

    def _consume(self, regex):
        m = regex.match(self._data, self._off)
        if m is None:
            raise ValueError
        self._off = m.end()
        return m

    def _pop_indent(self):
        try:
            i = self._indents.pop()
        except KeyError:
            i = -2
        if not self._indents:
            self._indents.append(-2)
        return i

    def _tok_open(self, value):
        self._indents.append(self._indents[-1] + 2)
        if self._was_colon:
            self._indents[-1] += self._value_indent
            self._fileobj.write(b"\n")
            self._fileobj.write(b" " * self._indents[-1])
        self._fileobj.write(value)
        self._fileobj.write(b" ")

    def _tok_close(self, value):
        if not self._is_empty:
            self._fileobj.write(b"\n")
            self._fileobj.write(b" " * self._indents[-1])
        self._fileobj.write(value)
        self._pop_indent()

    def _tok_comma(self, value):
        self._fileobj.write(b"\n")
        self._fileobj.write(b" " * self._indents[-1])
        self._fileobj.write(value)
        self._fileobj.write(b" ")

    def _tok_colon(self, value):
        self._fileobj.write(value)

    def _tok_other(self, value):
        if self._was_colon:
            self._fileobj.write(b" ")
        self._fileobj.write(value)

    def _tok_quote(self, value):
        self._tok_other(value)
        while True:
            m = self._consume(self._string_tokens)
            self._fileobj.write(m[0])
            if m["end"] is not None:
                break


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="stupid comma-first JSON formatter")
    p.add_argument("file", nargs="+", help="file to format")
    args = p.parse_args()

    for file in args.file:
        with open(file, "rb") as fp:
            data = fp.read()

        old = json.loads(data.decode("utf-8"))

        with NamedTemporaryFile(dir=os.path.dirname(file)) as tmp:
            format(tmp, data)
            tmp.flush()

            tmp.seek(0)
            new = json.loads(tmp.read().decode("utf-8"))
            assert new == old

            os.rename(tmp.name, file)
            tmp._closer.delete = False
