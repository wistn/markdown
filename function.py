# -*- coding: UTF-8 -*-
"""
Author:wistn
since:2021-04-22
LastEditors:Do not edit
LastEditTime:2021-04-22
Description: There are console_trace, lib.placeholder, lib.bind
"""
import inspect
import re
import sys
import traceback

""" Like javascript console.trace, print message_objects and stack trace to the position calling the function. """


def console_trace(*objects, sep=" ", end="\n"):
    print(
        *objects,
        " Trace:\n",
        "".join(traceback.format_stack()[-2:None:-1]),
        sep=sep,
        end=end
    )


class lib:
    class placeholdersMetaclass(type):
        def __getattr__(self, name):
            if re.search(r"^_(\d+)$", name):
                place = re.search(r"^_(\d+)$", name).group(1)
                value = self(place)
                setattr(self, name, value)
                # placeholders._1 is minimum
                return value
            print(
                "{}.__getattr__ # The method is called when name '{}' is accessed and is not defined meanwhile.".format(
                    self, name
                )
            )
            console_trace()
            return super().__getattribute__(name)

    class placeholders(metaclass=placeholdersMetaclass):
        # Like c++ std::placeholders, used for lib.bind function of this module, when the returnValue is invoked, each placeholder._N is replaced by the corresponding Nth argument of that returnValue.
        # lib.placeholder._N is auto generated placeholders instance('int' property save the number value N) after first access. See example below.

        def __init__(self, place) -> None:
            self.int = int(place)
            self.str = str(place)

        def __lt__(self, other):
            # for sorted([*instances])
            return self.int < other.int

        def __repr__(self) -> str:
            # list/dict always call __repr__ other than __str__, so handle __repr__
            return "lib.placeholders" + "<" + self.str + ">"

    """
    Like c++ std::std, returnValue can be called with bind_args, and some of its calling arguments(for replacing placeholders).

    originFun: The function be invoking at final.
    bind_args: Tuple of arguments originFun uses at final. The lib.placeholders._N of this module in it will be replaced by related arguments of returnValue when calling like c++. See example below.
    """

    @classmethod
    def bind(cls, originFun, *bind_args):
        # todo_: no accept keyword-only parameter because c++ also no.
        signature = inspect.signature(originFun)
        bindErrorMessage = "error: no matching function for call to object of type 'lib.bind<{0}>'.{1}".format(
            ", ".join(
                [
                    str(arg)
                    if isinstance(arg, lib.placeholders)
                    else str(type(arg))
                    .replace("<class ", "")
                    .replace(">", "")
                    .replace("'", "")
                    .replace('"', "")
                    for arg in (originFun, *bind_args)
                ]
            ),
            " The parameter of required callable function is " + str(signature) + ".",
        )
        try:
            # inspect.signature.bind is used for check len(argument bind_args) == len(position parameter of originFun), when keepping parameter default value
            signature.bind(*bind_args)
        except Exception as ex:
            print(bindErrorMessage)
            raise ex

        def parse(*call_args, **kw):
            bind_placeholdersArgs = [
                arg for arg in bind_args if isinstance(arg, lib.placeholders)
            ]
            if len(bind_placeholdersArgs) == 0:
                return originFun(*bind_args, **kw)
            callErrorMessage = (
                bindErrorMessage
                + " The argument type of calling function is '{}'.".format(
                    ", ".join(
                        [
                            str(arg)
                            if isinstance(arg, lib.placeholders)
                            else str(type(arg))
                            .replace("<class ", "")
                            .replace(">", "")
                            .replace("'", "")
                            .replace('"', "")
                            for arg in call_args
                        ]
                    ),
                )
            )
            placeholdersMax = sorted(bind_placeholdersArgs)[-1]
            if len(call_args) < placeholdersMax.int:
                raise Exception(callErrorMessage)
            replace_args = []
            for i in range(len(bind_args)):
                if isinstance(bind_args[i], lib.placeholders):
                    if isinstance(call_args[bind_args[i].int - 1], lib.placeholders):
                        raise Exception(callErrorMessage)
                    else:
                        replace_args.append(call_args[bind_args[i].int - 1])
                else:
                    replace_args.append(bind_args[i])
            return originFun(*replace_args, **kw)

        def boundFun(*call_args, **kw):
            return parse(*call_args, **kw)

        return boundFun


def main():
    """
    # lib.placeholder, lib.bind Examples:
    boundFun = lib.bind(console_trace, lib.placeholders._2, lib.placeholders._1, "a")
    boundFun("call_args1", "call_args2", 3)
    # like c++ std::std replace std::placeholders::_N, will print call_args2 call_args1 a ...
    """


if __name__ == "__main__":
    pass
    main()

